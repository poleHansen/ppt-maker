from __future__ import annotations

import re
from time import perf_counter
from typing import Literal

import httpx

from app.models.schemas import ModelInvocationResult, ModelProvider


ApiMode = Literal["responses", "chat_completions"]


class LlmGateway:
    def invoke_text(
        self,
        profile: ModelProvider,
        prompt: str,
        model_name: str | None = None,
    ) -> ModelInvocationResult:
        target_model = (model_name or profile.model_name).strip()
        if not target_model:
            raise ValueError("模型名称不能为空")

        api_key = profile.api_key.strip()
        if not api_key:
            raise ValueError("API Key 不能为空")

        base_url = profile.base_url.strip().rstrip("/")
        if not base_url:
            raise ValueError("Base URL 不能为空")

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        started_at = perf_counter()
        try:
            with httpx.Client(timeout=20.0) as client:
                response, api_mode = self._send_request(client, base_url, headers, target_model, prompt)
        except httpx.HTTPStatusError as exc:
            detail = self._extract_error_message(exc.response)
            raise ValueError(f"模型服务返回错误: {detail}") from exc
        except httpx.HTTPError as exc:
            raise ValueError(f"连接模型服务失败: {exc}") from exc

        latency_ms = int((perf_counter() - started_at) * 1000)
        data = response.json()
        content = self._extract_message_content(data, api_mode)
        if not content:
            raise ValueError("模型返回为空，未获取到可用响应")

        resolved_model = str(data.get("model") or target_model)
        return ModelInvocationResult(
            provider_name=profile.provider_name,
            model_name=resolved_model,
            content=content,
            latency_ms=latency_ms,
        )

    def _send_request(
        self,
        client: httpx.Client,
        base_url: str,
        headers: dict[str, str],
        model_name: str,
        prompt: str,
    ) -> tuple[httpx.Response, ApiMode]:
        errors: list[httpx.HTTPStatusError] = []

        for api_mode in self._candidate_modes(base_url):
            endpoint = self._resolve_endpoint(base_url, api_mode)
            payload = self._build_payload(model_name, prompt, api_mode)
            response = client.post(endpoint, headers=headers, json=payload)
            try:
                response.raise_for_status()
                return response, api_mode
            except httpx.HTTPStatusError as exc:
                if self._should_try_fallback(exc.response, api_mode):
                    errors.append(exc)
                    continue
                raise

        if errors:
            raise errors[-1]
        raise ValueError("未找到可用的模型接口")

    def _candidate_modes(self, base_url: str) -> list[ApiMode]:
        lowered = base_url.lower()
        if lowered.endswith("/responses"):
            return ["responses"]
        if lowered.endswith("/chat/completions"):
            return ["chat_completions"]
        return ["responses", "chat_completions"]

    def _resolve_endpoint(self, base_url: str, api_mode: ApiMode) -> str:
        lowered = base_url.lower()
        if api_mode == "responses":
            if lowered.endswith("/responses"):
                return base_url
            if lowered.endswith("/v1"):
                return f"{base_url}/responses"
            return f"{base_url}/v1/responses"

        if lowered.endswith("/chat/completions"):
            return base_url
        if lowered.endswith("/v1"):
            return f"{base_url}/chat/completions"
        return f"{base_url}/v1/chat/completions"

    def _build_payload(self, model_name: str, prompt: str, api_mode: ApiMode) -> dict:
        if api_mode == "responses":
            return {
                "model": model_name,
                "input": prompt,
                "max_output_tokens": 32,
            }

        return {
            "model": model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
            "max_tokens": 32,
        }

    def _should_try_fallback(self, response: httpx.Response, api_mode: ApiMode) -> bool:
        if api_mode != "responses":
            return False
        if response.status_code in {404, 405, 426}:
            return True

        try:
            payload = response.json()
        except ValueError:
            return False

        message = str(payload.get("error", {}).get("message") or payload).lower()
        return "responses" in message and ("not found" in message or "unsupported" in message)

    def _extract_message_content(self, data: dict, api_mode: ApiMode) -> str:
        if api_mode == "responses":
            return self._extract_responses_content(data)

        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            return ""

        message = choices[0].get("message") or {}
        content = message.get("content", "")
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            text_parts = []
            for item in content:
                if isinstance(item, dict) and item.get("type") == "text":
                    text_parts.append(str(item.get("text", "")))
            return "\n".join(part for part in text_parts if part).strip()
        return ""

    def _extract_responses_content(self, data: dict) -> str:
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            return output_text.strip()

        output = data.get("output")
        if not isinstance(output, list):
            return ""

        text_parts: list[str] = []
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for block in content:
                if not isinstance(block, dict):
                    continue
                if block.get("type") in {"output_text", "text"}:
                    text_value = block.get("text")
                    if isinstance(text_value, str) and text_value.strip():
                        text_parts.append(text_value.strip())

        return "\n".join(text_parts).strip()

    def _extract_error_message(self, response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            return self._summarize_plain_error(response)

        error = payload.get("error")
        if isinstance(error, dict):
            return str(error.get("message") or error)
        if isinstance(error, str):
            return error
        return str(payload)

    def _summarize_plain_error(self, response: httpx.Response) -> str:
        body = response.text.strip()
        if not body:
            return f"HTTP {response.status_code}"

        lowered = body.lower()
        if "cloudflare" in lowered:
            status_match = re.search(r"error code\s*(\d{3})", body, re.IGNORECASE)
            title_match = re.search(r"<title>(.*?)</title>", body, re.IGNORECASE | re.DOTALL)
            status_code = status_match.group(1) if status_match else str(response.status_code)
            title = ""
            if title_match:
                title = re.sub(r"\s+", " ", title_match.group(1)).strip()
            if title:
                return f"上游站点返回 Cloudflare 错误 {status_code}: {title}"
            return f"上游站点返回 Cloudflare 错误 {status_code}"

        if "<html" in lowered:
            title_match = re.search(r"<title>(.*?)</title>", body, re.IGNORECASE | re.DOTALL)
            if title_match:
                title = re.sub(r"\s+", " ", title_match.group(1)).strip()
                return f"模型服务返回 HTML 页面而不是 OpenAI 接口 JSON: {title}"
            return "模型服务返回 HTML 页面而不是 OpenAI 接口 JSON"

        condensed = re.sub(r"\s+", " ", body)
        if len(condensed) > 180:
            condensed = f"{condensed[:177]}..."
        return condensed