# Rotor Framework

[![build status](https://img.shields.io/github/actions/workflow/status/mobalazs/rotor-framework/main-workflow.yml?branch=main&logo=github&label=build)](https://github.com/mobalazs/rotor-framework/actions/workflows/main-workflow.yml)
[![Coverage Status](https://img.shields.io/coveralls/github/mobalazs/rotor-framework/main?logo=coveralls&logoColor=white&color=brightgreen)](https://coveralls.io/github/mobalazs/rotor-framework?branch=main)
[![npm version](https://img.shields.io/npm/v/rotor-framework.svg?logo=npm)](https://www.npmjs.com/package/rotor-framework)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square&logo=apache&logoColor=white)](LICENSE)
[![Slack](https://img.shields.io/badge/Slack-RokuDevelopers-4A154B?logo=slack)](https://rokudevelopers.slack.com)

**Rotor** is a UI framework that brings structure to large Roku apps, built natively in BrighterScript and SceneGraph. It pairs a declarative ViewBuilder (full lifecycle, focus handling, virtual node tree) with a Roku-friendly, cross-thread MVI pattern. The result is predictable state, reusable components, and rendering you can reason about, keeping apps maintainable and scalable.

[🌱](#token-efficient-documentation-for-ai)

---

## 🚀 Key Features

-   **ViewBuilder system**: Declarative and extensible view construction with a flexible, code-based template system, automatic full lifecycle management, and a virtual node tree abstraction.
-   **Roku-friendly MVI design pattern**: Predictable state, clear separation of concerns, and cross-thread compatibility.
-   **Component-based UI**: Isolated, reusable UI widgets and view models.
-   **i18n support**: Locale-aware interface with flexible language resource injection.
-   **Integrated** [Animate](https://github.com/haystacknews/animate) Library

---

## 🎯 Quick Start with Starter Template

Want to get started quickly? Check out **[rotor-starter](https://github.com/mobalazs/rotor-starter)** - a ready-to-use project template with Rotor Framework pre-configured, sample components, and best practices built in.

---

## 📦 Installation

### Prerequisites

Rotor Framework requires BrighterScript v1. Install the latest version:

```bash
npm install --save-dev brighterscript@next @rokucommunity/bslint@next
```

### Install Rotor Framework

**Manual installation:**

1. Download the latest `rotor-framework.zip` from [GitHub Releases](https://github.com/mobalazs/rotor-framework/releases)
2. Extract the ZIP into your project's `source/` directory (this will create a `rotor-framework/` folder)
3. Import Rotor in your main file:

**ROPM install:**

-   **Note:** You must install without prefix by adding this to `package.json`
-   Don't worry everything is in the `Rotor` namespace by default, so this is the only name reserved by the framework.

```bash
ropm install rotor-framework
```

```json
"ropm": {
    "noprefix": ["rotor-framework"]
}
```

---

## ⚡ Quick usage

```vb
import "pkg:/source/RotorFramework.bs"

frameworkInstance = new Rotor.Framework()

frameworkInstance.render([
    {
        id: "helloLabel", ' optional
        nodeType: "Label",
        fields: {
            text: "Hello World!",
            color: "#CCCCCC"
        }
    }
])
```

---

<a id="token-efficient-documentation"></a>

## Token-efficient documentation for AI

You can find [🌱](./docs/ai/readme.opt.yaml) symbols in all documentation pages. These symbols link to AI-optimized summaries of the respective documentation.

**📖 [Read more about token savings](./docs/token-efficient-docs.md)**

---

## 📚 Learn More

![Version](https://img.shields.io/badge/version-v0.9.3-blue?label=Documents)

### Framework Core

-   [Framework Initialization](./docs/framework-initialization.md) - Configuration, task synchronization

### ViewBuilder Reference

-   [ViewBuilder Overview](./docs/view-builder-overview.md) - High-level architecture and core concepts
-   [Widget Reference](./docs/view-builder-widget-reference.md) - Complete Widget properties, methods, and usage patterns
-   [ViewModel Reference](./docs/view-builder-viewmodel-reference.md) - Complete ViewModel structure, lifecycle, and state management

### ViewBuilder Plugins

-   [ViewBuilder Fields Plugin](./docs/view-builder-fields-plugin.md) - Field management and binding
-   [ViewBuilder FontStyle Plugin](./docs/view-builder-fontstyle-plugin.md) - Typography and styling
-   [ViewBuilder Observer Plugin](./docs/view-builder-observer-plugin.md) - State observation patterns
-   [ViewBuilder Focus Plugin](./docs/view-builder-focus-plugin.md) - Focus management system

### MVI Documentation

-   [Cross-Thread MVI design pattern](./docs/cross-thread-mvi.md) - State management across threads
-   [Combined Reducers](./docs/combine-reducers.md) - Compose slice reducers into one dispatcher with cross-slice coordination

### i18N Documentation

-   [Internationalization support](./docs/i18n-support.md) - Locale-aware interface implementation

---

## 🔧 Requirements

-   Roku OS 15.0+ (required — the cross-thread engine uses the `roRenderThreadQueue` data-transfer API introduced in OS 15)
-   BrighterScript V1

---

## 📄 Licensing

Rotor Framework is available under a dual license model:

### Open Source License (Apache 2.0)

The source code is licensed under the [Apache License 2.0](LICENSE). This is a permissive open source license that allows you to:

- Use Rotor Framework in commercial and non-commercial applications
- Modify the source code for your own purposes
- Distribute your applications without sharing your application source code
- Include Rotor Framework in proprietary products

The Apache 2.0 license requires you to:

- Include a copy of the license in distributions
- Provide attribution in a NOTICE file (if included) or documentation
- State any modifications you made to the framework source files

### Commercial License

A separate commercial license is available for organizations that require:

- Use of the "Rotor Framework" trademark in product branding or marketing
- White-label or OEM distribution arrangements
- Resale or redistribution of the framework as a standalone product
- Official support, warranty, or indemnification

For commercial licensing inquiries, please contact the maintainer.

### Trademark

"Rotor Framework" is a trademark. Use of the name is governed by our [Trademark Policy](TRADEMARK.md), which is separate from the code license. In summary:

- You may state that your product is "built with Rotor Framework"
- You may not imply official endorsement or use the name in your product branding without permission

---

## Attribution (Optional)

Attribution is **not required** under the Apache 2.0 license for applications built with Rotor Framework. However, if you find this framework useful, we encourage you to include a voluntary attribution such as:

> Built with [Rotor Framework](https://github.com/mobalazs/rotor-framework)

or

> Powered by Rotor Framework

This helps others discover the project and supports the open source community. Thank you for considering it.

---

**Copyright © 2025-2026 Balazs Molnar**

---
