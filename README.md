[English](./README.md) | [中文](./README.zh-CN.md)

<div align="center">
	<img
		src="./src/vs/workbench/browser/parts/editor/media/slice_of_void.png"
	 	alt="CoderChat Welcome"
		width="300"
	 	height="300"
	/>
</div>

## CoderChat

Like Void, CoderChat is an alternative to tools such as Cursor, Qoder, Trae, and CodeBuddy. It primarily addresses their limitations: inability to freely configure models, opaque pricing, and lack of support for data compliance in special scenarios.

CoderChat is developed from Void and serves as an upgraded version. This repository retains all features from Void while providing deep optimizations and continuous feature iteration.

Use AI agents on your codebase, checkpoint and visualize changes, and bring any model or host locally. CoderChat sends messages directly to providers without retaining your data.

## Preview

<div align="center">
	<img
		src="./doc/imgs/chat.png"
	 	alt="chat"
	/>
</div>

## Usage & Configuration

> **Important**: The values of `contextWindow` and `reservedOutputTokenSpace` must be configured according to the specific model you are using. Additionally, `specialToolFormat` must be set correctly; otherwise, unexpected issues may occur. Supported values for `specialToolFormat` are `'openai-style'`, `'anthropic-style'`, and `'gemini-style'`. If left empty, it defaults to `'openai-style'`.

Below is the configuration reference for the GLM-5 model:

```json
{
  "contextWindow": 128000,
  "reservedOutputTokenSpace": 4096,
  "supportsSystemMessage": "system-role",
  "specialToolFormat": "openai-style",
  "supportsVision": false,
  "reasoningCapabilities": {
    "supportsReasoning": true,
    "canTurnOffReasoning": false,
    "canIOReasoning": false,
    "openSourceThinkTags": ["<think>", "</think>"]
  }
}
```

> **Note**: Enabling `supportsVision` enables image input support. Only enable this if the model actually supports vision capabilities.

Example configuration for a vision-capable model (e.g., Kimi-K2.5):

```json
{
  "contextWindow": 128000,
  "reservedOutputTokenSpace": 4096,
  "supportsSystemMessage": "system-role",
  "specialToolFormat": "openai-style",
  "supportsVision": true,
  "reasoningCapabilities": {
    "supportsReasoning": true,
    "canTurnOffReasoning": false,
    "canIOReasoning": false,
    "openSourceThinkTags": ["<think>", "</think>"]
  }
}
```

## Important Notes

- More than 95% of the code in this project was developed by **CoderChat + GLM5 + MiniMax-M2.7**.
- Development configuration for this project can be customized using CoderChat itself. Therefore, the author will not provide separate usage documentation.
- For documentation related to Void, please refer to the official Void project documentation.
- Although CoderChat supports local models and arbitrary model configuration via APIs, tests have shown that models without strong agent coding capabilities cannot reliably deliver production-grade results. For recommended models, refer to the coding plan supported model lists from mainstream providers. The primary model used in the development of this project is GLM-5.

## Reference

- CoderChat is a fork of [Void](https://github.com/voideditor/void/tree/main).
- Void is a fork of the [vscode](https://github.com/microsoft/vscode) repository.

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details.
