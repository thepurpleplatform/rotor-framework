# Framework Initialization

[← README.md](../README.md#-learn-more) | [🌱](./ai/framework-initialization.opt.yaml)

## Overview

The Rotor Framework is initialized by creating an instance of the `Rotor.Framework` class. This main orchestrator sets up the entire framework ecosystem including the ViewBuilder, internationalization service, dispatcher provider, animation system, and plugin architecture.

## Basic Initialization

```brightscript
' Minimal initialization
framework = new Rotor.Framework()

' With configuration
framework = new Rotor.Framework({
    tasks: ["DataTask", "NetworkTask"],
    rootNode: m.top,
    readyFieldId: "isReady",
    onReady: sub()
        print "Framework ready!"
    end sub
})
```

## Configuration Options

### Core Configuration

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `rootNode` | roSGNode | No | Root SceneGraph node for the framework. Defaults to `top` node if not specified. |
| `tasks` | array | No | List of task node names to synchronize with the render thread. When specified, the render queue waits for all tasks to signal ready before flushing. |
| `onReady` | function | No | Callback function invoked after tasks are synced and the render queue is flushed. Called in **global scope** (`GetGlobalAA()`) — i.e. inside `onReady` the `m` scope is the same `m` you have where you instantiate the framework (typically the component's `init()`), so `m.framework`, `m.top`, etc. are reachable. **Only needed when `tasks` are configured** — without tasks the framework instantiates synchronously and is ready immediately. |
| `readyFieldId` | string | No | Field name to add to the root node that will be set to `true` after tasks are synced and render queue is flushed. Useful for triggering observers. **Only relevant when `tasks` are configured.** |
| `plugins` | array | No | List of plugin instances to register. Default plugins are automatically included. Custom plugins are not documented yet. |
| `allowNativeAudioGuide` | boolean | No | Whether to allow native AudioGuide next to the TTS service. If `true` (default), rootNode.muteAudioGuide is **not** touched. If `false`, native AudioGuide is muted while the TTS service is enabled and the device screen reader is on. |
| `debug` | object | No | Debug configuration options. |

### Debug Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `debug.autoSetNodeId` | boolean | false | Automatically set node IDs for debugging purposes. |
| `debug.logTts` | boolean | false | Log every TTS request in debug builds as `[ROTOR][TTS] say: <composed phrase> (active: <bool>)`, also when the screen reader is off. Switchable at runtime with `ttsService.isLoggingEnabled`. Compiled out of non-debug builds. |

## Task Synchronization

When building applications with background tasks, you often need to wait for those tasks to initialize before rendering the UI. The framework provides built-in task synchronization.

> **Note:** Task synchronization — and the `onReady` callback / `readyFieldId` (`isReady`) field — is **only relevant when you configure `tasks`**. Without tasks, the framework instantiates **synchronously** and is ready immediately, so you don't need `onReady` or `readyFieldId` at all.

### Why Task Synchronization?

- **Cross-thread initialization**: Ensure task threads are ready before the render thread proceeds
- **State management**: Wait for initial state to be loaded from tasks before rendering
- **Predictable startup**: Guarantee a specific initialization order across threads

### How It Works with the Render Queue

The ViewBuilder itself executes **synchronously**, but the framework uses an **internal render queue** to manage timing with task synchronization. This means you don't need to worry about timing when calling `render()`:

**Key Points:**
- You can call `render()` immediately after framework instantiation, even before tasks are synchronized
- Render calls are queued internally and maintain their order
- If tasks are not yet synced, the render queue waits automatically
- Once all tasks signal ready, the framework flushes the render queue in order
- The `onReady` callback fires after the queue is flushed

**Bypassing the Queue with `enableRenderBeforeReady`:**

If you need to render UI **immediately** without waiting for task synchronization, you can pass `{ enableRenderBeforeReady: true }` as the last parameter to `render()`. This bypasses the render queue and executes the render operation immediately.

```brightscript
' Render immediately, bypassing the queue
m.framework.render({
    id: "MyStaticAsset",
    viewModel: ViewModels.MyStaticAsset
}, { enableRenderBeforeReady: true })
```

**⚠️ Important Warning:**

When using `enableRenderBeforeReady: true`, do **not** access features that depend on tasks being ready:
- ❌ Don't call dispatchers that communicate with task threads
- ✅ Safe to render static UI (loading screens, placeholders, etc.)


### Task Synchronization Example

**Render Thread (Main):**
```brightscript
sub init()
    m.framework = new Rotor.Framework({
        tasks: ["DataTask", "NetworkTask"],
        rootNode: m.top,
        readyFieldId: "isReady",
        onReady: sub()
            ' Framework and all tasks are ready
            print "All systems ready!"
        end sub
    })
end sub
```

## Plugin Configuration

The framework includes the following default plugins:

- **FieldsPlugin**: Dynamic field expressions and interpolation
- **FontStylePlugin**: Typography configuration
- **FocusPlugin**: Spatial navigation and focus management
- **DispatcherProviderPlugin**: MVI state management integration
- **ObserverPlugin**: Field observation and change callbacks

**Custom Plugins:**

Creating custom plugins is possible, but currently not documented. If you need to create custom plugins, please contact the author for guidance.

## Framework Public Methods

| Method | Parameters | Return | Description |
|--------|------------|--------|-------------|
| `render` | `payload` (object), `params` (object, optional) | void | Render or update widgets |
| `erase` | `payload` (dynamic) | void | Destroy widgets |
| `findWidgets` | `searchPattern` (string) | object | Find widgets by pattern |
| `getWidget` | `searchPattern` (string) | object | Get widget by ID or pattern |
| `getTopWidgets` | `matchingPattern` (string, optional) | object | Get top-level widgets |
| `getRootWidget` | - | object | Get root widget instance |
| `getSubtreeClone` | `searchPattern` (string), `keyPathList` (object, optional) | object | Clone widget subtree |
| `getRootNode` | - | object | Get root SceneGraph node |
| `connectDispatcher` | `dispatcherId` (string) | object | Connect to dispatcher by ID |
| `dispatchTo` | `dispatcherId` (string), `dispatchObject` (object) | void | Dispatch an intent to a specific dispatcher by ID |
| `getStateFrom` | `dispatcherId` (string), `mapStateToProps` (function, optional) | object | Get current state from a specific dispatcher by ID |
| `animator` | `animatorId` (dynamic) | object | Get animator factory |

---

## 📚 Learn More

**NEXT STEP: [Widget Reference](./view-builder-widget-reference.md)**

**Reference Documentation:**
- [ViewBuilder Overview](./view-builder-overview.md) - High-level architecture and concepts
- [Widget Reference](./view-builder-widget-reference.md) - Complete Widget properties, methods, and usage patterns
- [ViewModel Reference](./view-builder-viewmodel-reference.md) - Complete ViewModel structure, lifecycle, and state management

**Plugin Documentation:**
- [Fields Plugin](./view-builder-fields-plugin.md) - Field management with expressions and interpolation
- [FontStyle Plugin](./view-builder-fontstyle-plugin.md) - Typography and font styling
- [Observer Plugin](./view-builder-observer-plugin.md) - Field observation patterns
- [Focus Plugin](./view-builder-focus-plugin.md) - Focus management and navigation

**Additional Documentation:**
- [Cross-Thread MVI design pattern](./cross-thread-mvi.md) - State management across threads
- [Internationalization support](./i18n-support.md) - Locale-aware interface implementation
