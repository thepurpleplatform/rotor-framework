# Cross-Thread MVI Pattern

[← README.md](../README.md#-learn-more) | [🌱](./ai/cross-thread-mvi.opt.yaml)

## Overview

The Cross-Thread MVI pattern enables thread-safe state management across render and task threads. The pattern consists of three core components: **Model** (state container), **Reducer** (state transformation logic), and **Dispatcher** (thread-safe communication bridge).

![Rotor Framework Cross-Thread MVI](images/Rotor_Framework_cross-thread_MVI.jpeg)

## Core Components

### Model

The Model holds application state. It extends the `Model` base class and defines the initial state structure.

```brightscript
class CounterModel extends Model
    state = {
        count: 0,
        lastUpdated: invalid
    }
end class
```

### Reducer

The Reducer transforms state in response to Intents. It consists of two parts: **middleware** (for async operations) and **reducer function** (for state updates).

```brightscript
class CounterReducer extends Reducer

    ' Middleware runs before reducer - useful for async operations
    override function applyMiddlewares()
        return [

            ' Logger middleware
            function(intent, state) as Intent
                ' Log
                return intent ' NEXT
            end function,

            ' Async HTTP middleware using registerSourceObject
            function(intent, state) as Intent
                if intent.type = "LOAD_COUNT"
                    ' Framework creates the object, sets port, routes by identity
                    transfer = m.registerSourceObject("roUrlTransfer")
                    transfer.SetUrl("https://api.example.com/count")

                    ' Start async request
                    transfer.AsyncGetToString()

                    return invalid  ' Stop reducer execution
                end if

                return intent ' NEXT
            end function
        ]
    end function

    ' Reducer updates state based on intent
    override function reducer(state, intent)
        if intent.type = "INCREMENT"
            state.count = state.count + 1
            state.lastUpdated = createObject("roDateTime").toISOString()
        else if intent.type = "COUNT_LOADED"
            state.count = intent.payload.value
            state.lastUpdated = createObject("roDateTime").toISOString()
        end if

        return state
    end function

    ' Handle source object events (roUrlEvent, roDeviceInfoEvent, etc.)
    override sub onSourceEvent(msg as object)
        if msg.GetResponseCode() = 200
            data = ParseJson(msg.GetString())
            m.dispatch({ type: "COUNT_LOADED", payload: { value: data.count } })
        end if
    end sub
end class
```

### Dispatcher

The Dispatcher connects Model and Reducer, providing thread-safe communication through three key methods:

#### createDispatcher

Creates a dispatcher instance on the task thread:

```brightscript
' Initialization

model = new Models.CounterModel()
reducer = new Reducers.CounterReducer()

' Register dispatcher with name, model, and reducer (name is globally unique)
Rotor.createDispatcher("counter", model, reducer)

```

#### dispatch

Sends intents to trigger state changes. Can be called from any thread:

```brightscript
dispatcher = m.connectDispatcher("counter")

' Dispatch intent
dispatcher.dispatch({
    type: "INCREMENT",
    payload: { foo: "bar" }
})
```

#### getState

Retrieves current state. Executes callback with current state:

```brightscript
' Get state once
m.dispatcher.getState(sub(props, state)
    props.count = state.count
    props.lastUpdated = state.lastUpdated
end sub)
```

**Note**: In reducers, you can use these helper methods to access state and dispatch intents:

```brightscript
' In a reducer - access own dispatcher's state
currentState = m.getState()

' Dispatch to own dispatcher
m.dispatch({ type: "SOME_ACTION" })

' Dispatch to another dispatcher by ID
m.dispatchTo("otherDispatcher", { type: "SOME_ACTION" })

' Get state from another dispatcher by ID
otherState = m.getStateFrom("otherDispatcher")
```

#### addListener

Subscribes to state changes. Listener fires whenever state updates:

```brightscript
' Listen for state changes
m.dispatcher.addListener({
    ' Optional: Map state to local props
    mapStateToProps: sub(props, state)
        props.count = state.count
    end sub,

    ' Optional: filter when to trigger callback
    allowUpdate: sub(state)
        return state.count > 0
    end sub,

    ' Optional: Callback when state changes
    callback: sub()
        return state.count > 0
    end sub,

    ' Optional: CallbackWithState when state changes
    callbackWithState: sub(state)
        return state.count > 0
    end sub,

    ' Optional: remove after first trigger
    once: false
})
```

#### registerSourceObject

Creates and registers a Roku source object by type name for automatic event routing. The framework manages object creation, message port assignment, and event routing. **Only available on the task thread** — source objects require a task thread message port for event routing.

**Syntax:** `m.registerSourceObject(typeName, eventFilter)` → returns the created (or shared) source object

The framework auto-detects the routing mode based on the object type:

- **Identity-based routing**: Objects with `GetIdentity()` (e.g., `roUrlTransfer`, `roChannelStore`) — a new instance is created per call. Events are routed 1:1 to the registering dispatcher via `GetSourceIdentity()`.
- **Broadcast routing (singleton)**: Objects without `GetIdentity()` (e.g., `roDeviceInfo`, `roInput`, `roAppManager`) — the first call creates the instance, subsequent calls return the **shared singleton** and add the dispatcher as a subscriber. Use `eventFilter` to filter relevant events. This eliminates duplicate instances when multiple reducers need the same broadcast source.

**Identity-based example (roUrlTransfer):**

```brightscript
' In reducer middleware
function(intent, state) as Intent
    if intent.type = "FETCH_DATA"
        ' Framework creates object, sets port, routes by identity
        transfer = m.registerSourceObject("roUrlTransfer")
        transfer.SetUrl("https://api.example.com/data")

        ' Start async request
        transfer.AsyncGetToString()

        return invalid  ' Halt reducer execution
    end if
    return intent
end function
```

**Broadcast example (roDeviceInfo):**

```brightscript
' In onCreateDispatcher lifecycle hook
override sub onCreateDispatcher()
    ' Framework creates (or returns shared) instance, sets port
    m.deviceInfo = m.registerSourceObject("roDeviceInfo", function(msg as object) as boolean
        return msg.GetInfo()?.linkStatus <> invalid
    end function)
    m.deviceInfo.EnableLinkStatusEvent(true)
end sub
```

The framework automatically routes events to your reducer's `onSourceEvent()` method:

```brightscript
override sub onSourceEvent(msg as object)
    msgType = type(msg)

    if msgType = "roUrlEvent"
        if msg.GetResponseCode() = 200
            data = ParseJson(msg.GetString())
            m.dispatch({ type: "DATA_LOADED", payload: { data: data } })
        end if
    else if msgType = "roDeviceInfoEvent"
        info = msg.GetInfo()
        m.dispatch({ type: "LINK_STATUS_CHANGED", payload: { linkStatus: info.linkStatus } })
    end if
end sub
```

**Cleanup:** Call `m.unregisterSourceObject(sourceObject)` when the source object is no longer needed.

**Benefits:**
- Unified API for all Roku source objects (HTTP, device info, input, etc.)
- No need to manually call `CreateObject()` or `SetMessagePort()` — the framework handles both
- Identity-based objects are routed precisely; broadcast objects use `eventFilter` for filtering
- Broadcast objects are singletons — multiple reducers share one instance, eliminating duplicate event dispatching
- No need to create separate Task nodes for async operations

## Complete Example

### Task Thread Setup

```brightscript
sub taskFunction()
    ' Create model and reducer
    counterModel = new Models.CounterModel()
    counterReducer = new Reducers.CounterReducer()

    ' Create dispatcher
    Rotor.createDispatcher("counter", counterModel, counterReducer)

    ' Start sync
    m.appFw.sync()
end sub
```

### Render Thread Usage

```brightscript
namespace ViewModels
    class CounterView extends Rotor.ViewModel

        override sub onCreateView()
            m.dispatcher = m.connectDispatcher("counter")

            ' Get initial state
            m.dispatcher.getState(sub(props, state)
                props.count = state.count
            end sub)

            ' Listen for changes
            m.dispatcher.addListener({
                mapStateToProps: sub(props, state)
                    props.count = state.count
                end sub,
                callback: m.updateCounter
            })
        end sub

        override function template() as object
            return {
                nodeType: "Label",
                id: "counterLabel",
                fields: {
                    text: `Count: ${m.props.count}`
                }
            }
        end function

        sub updateCounter()
            ' Re-render on state change
            m.render({
                id: "counterLabel",
                fields: {
                    text: `Count: ${m.props.count}`
                }
            })
        end sub

        sub onIncrementPress()
            ' Dispatch intent (traditional way)
            m.dispatcher.dispatch({
                type: "INCREMENT"
            })

            ' Or use convenience method
            m.dispatchTo("counter", { type: "INCREMENT" })
        end sub

        sub checkCurrentState()
            ' Get state using convenience method
            currentState = m.getStateFrom("counter")
            print "Current count: " + currentState.count.toStr()
        end sub
    end class
end namespace
```

## Thread Flow

```
[Render Thread]           [Task Thread]
     |                         |
     | dispatch(intent)        |
     |------------------------>|
     |                         | middleware
     |                         | reducer
     |                         | state update
     | listener callback       |
     |<------------------------|
     | UI update               |
```

## Dispatcher Accessibility

### Task Thread Dispatchers

Dispatchers created in a task thread using `Rotor.createDispatcher()` are globally accessible:
- Accessible from the render thread via `m.connectDispatcher(name)`
- Accessible from any other task thread via `m.connectDispatcher(name)`
- Enable true cross-thread communication and state synchronization

### Render Thread Dispatchers

Dispatchers can also be created in the render thread using the exactly same pattern (Model + Reducer + createDispatcher):

```brightscript
' In render thread - for complex component internal state
class MyViewModel extends Rotor.ViewModel
    override sub onCreateView()
        model = new Models.ComponentStateModel()
        reducer = new Reducers.ComponentStateReducer()

        ' Create dispatcher
        Rotor.createDispatcher("localComponent", model, reducer)
    end sub
    ...
end class
```

**Cross-thread dispatch is bidirectional and rendezvous-free.** A render-owned dispatcher is fully reachable from a task thread: a task reducer can `m.dispatchTo("layout", intent)` a render-owned dispatcher (task→render), just as the render thread dispatches to task-owned dispatchers (render→task). Task→task (between two different task threads) works the same way. In every case you call `dispatch` / `dispatchTo` identically regardless of where the target lives; the framework routes the intent to the owning thread, reduces it there, and syncs state back to listeners on every subscribed thread.

Choose ownership by where the state naturally lives, not by which threads consume it:

Use **render-owned** dispatchers for state the UI mutates locally, where render-thread reads/writes should stay synchronous and rendezvous-free:
- Complex component internal state management
- Cross-component UI state coordination
- Local UI state (still fully dispatchable from a task when needed)

Use **task-owned** dispatchers for business/shared state, async work (API calls, timers), and anything driven from the task thread.

> **Note on timing:** cross-thread dispatch is asynchronous. After dispatching to a dispatcher owned by another thread, `getState()` on the calling thread is not immediately updated — state is read-your-writes only on the owning thread and propagates to other threads one cycle later via the listener/sync channel.

## Key Principles

### State Mutations Happen Only in the Reducer

All state changes go through the reducer and run on the dispatcher's **owning thread** — the task thread for task-owned dispatchers, the render thread for render-owned dispatchers. Consumers never modify state directly; they dispatch intents. For the common case of task-owned business state, this means all mutations happen on the task thread and the render thread only reads/subscribes.

### Middleware for Async Operations

Use middleware for API calls, timers, or complex logic. Return `invalid` to prevent reducer execution, or return the intent to continue.

### Listeners for UI Updates

Use listeners to react to state changes. Filter updates with `allowUpdate` for efficiency.

### Single Source of Truth

Each dispatcher maintains one model as the single source of truth for its domain. Multiple components can subscribe to the same dispatcher.

## Best Practices

- Keep models focused on specific domains (e.g., user, content, settings)
- Use clear, descriptive intent types
- **Use `m.registerSourceObject(typeName)` for source objects** (`roUrlTransfer`, `roDeviceInfo`, etc.) — the framework creates and manages the object for you
- **Use `eventFilter` with broadcast objects** (e.g., `roDeviceInfo`) to filter relevant events in `onSourceEvent()`
- **Use `m.getState()` in reducers** to access current state directly without callback
- **Use `m.dispatchTo()` and `m.getStateFrom()`** in widgets and reducers for concise cross-dispatcher access
- Filter listener updates with `allowUpdate` when needed
- Remove listeners with `once: true` for one-time operations
- Handle all state mutations in the reducer, never in middleware


---

## 📚 Learn More

**[ViewBuilder Overview](./view-builder-overview.md)**

**Reference Documentation:**
- [Framework Initialization](./framework-initialization.md) - Configuration, task synchronization, and lifecycle
- [ViewBuilder Overview](./view-builder-overview.md) - High-level architecture and concepts
- [Widget Reference](./view-builder-widget-reference.md) - Complete Widget properties, methods, and usage patterns
- [ViewModel Reference](./view-builder-viewmodel-reference.md) - Complete ViewModel structure, lifecycle, and state management

**Plugin Documentation:**
- [Fields Plugin](./view-builder-fields-plugin.md) - Field management with expressions and interpolation
- [FontStyle Plugin](./view-builder-fontstyle-plugin.md) - Typography and font styling
- [Observer Plugin](./view-builder-observer-plugin.md) - Field observation patterns
- [Focus Plugin](./view-builder-focus-plugin.md) - Focus management and navigation

**Additional Documentation:**
- [Internationalization support](./i18n-support.md) - Locale-aware interface implementation
