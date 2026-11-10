# TTS Service (Text-to-Speech)

The TTS Service provides text-to-speech functionality for Rotor Framework applications using the native Roku `roAudioGuide` API.

## Overview

The TTS Service is a framework-level service (similar to `i18nService`) that enables widgets to speak text through a simple decorator pattern. It supports advanced features like declarative phrase composition (`say` / `role` / `state` / `position` with a localizable vocabulary), flush control, character-by-character spelling, duplicate speech prevention, sentence secure (rapid navigation protection), and localized symbol pronunciation.

## Architecture

The TTS implementation consists of two layers:

1. **TtsService** - Framework service that wraps native `roAudioGuide` API
2. **widget.tts()** - Widget decorator that returns the `TtsService` instance; speak with `widget.tts().speak({...})`

## Basic Usage

### Simple Speech

```brightscript
' Speak text from any widget
widget.tts().speak({
    say: "Hello world"
})
```

### Dynamic Speech (Function)

```brightscript
' Use a function that returns text
widget.tts().speak({
    say: function() as string
        return "Current count: " + Str(m.viewModelState.count)
    end function
})
```

### String Interpolation

```brightscript
' Use @ to reference context.viewModelState properties
widget.tts().speak({
    say: "You selected @selectedItem.title",
    context: m
})

' Use $ to reference context properties (HID, id, etc.)
widget.tts().speak({
    say: "Widget $id has focus",
    context: m
})

' Multiple interpolations
widget.tts().speak({
    say: "Loading @loadingProgress percent in widget $id",
    context: m
})
```

### Phrase Composition (say / role / state / position)

`speak()` builds the spoken phrase from parts and joins them with `", "`. Empty parts are skipped. The order is always `say`, `role`, `state`, `position`.

```brightscript
' say can be an array of parts (strings and/or functions)
widget.tts().speak({
    say: ["Play", m.props.title]
})
' Speaks: "Play, The Odyssey"

' A part that is exactly an "@l10n.path" key is translated via i18nService (no context needed)
widget.tts().speak({
    say: "@l10n.buttons.play",
    role: "button"
})
' Speaks: "Play, button"

' state: true/false -> "on"/"off", or a key of the states vocabulary
widget.tts().speak({
    say: "Subtitles",
    role: "button",
    state: true
})
' Speaks: "Subtitles, button, on"

' position: [zeroBasedIndex, count]
widget.tts().speak({
    say: m.props.title,
    position: [2, 20]
})
' Speaks: "The Odyssey, 3 of 20"
```

| Field | Value | Spoken as |
|-------|-------|-----------|
| `say` | string, function, or array of those | each part, joined with `", "` |
| `role` | string, e.g. `"button"` | `l10n.tts.roles.<role>`, or the given string if the vocabulary has no such key |
| `state` | boolean | `l10n.tts.states.on` / `l10n.tts.states.off` |
| `state` | string, e.g. `"selected"` | `l10n.tts.states.<state>`, or the given string if the vocabulary has no such key |
| `position` | `[zeroBasedIndex, count]` | `l10n.tts.position` with `{index}` (one based) and `{count}` replaced |

`say` is optional when `position` or `state` is given (`speak({ position: [0, 5] })` speaks "1 of 5").

**Vocabulary.** English defaults are built in; `l10n.tts` overrides them per key, so a translation only needs the keys it changes and the phrase follows language changes automatically:

```brightscript
' Built-in defaults
{
    position: "{index} of {count}",
    roles: { button: "button" },
    states: { on: "on", off: "off", selected: "selected" }
}

' Hungarian translation file (only the tts part shown)
{
    tts: {
        position: "{index} / {count}",
        roles: { button: "gomb", slider: "csúszka" },
        states: { on: "be", off: "ki", selected: "kiválasztva" }
    }
}
```

**`@l10n` keys.** Only a part that is the key and nothing else is translated (`"@l10n.buttons.play"`). A key that is not found, or that does not resolve to a string, is spoken as written. Inside a longer text (`"@l10n.buttons.play now"`) the composition does not translate; use an array of parts instead.

### Flush Control (Interrupt Current Speech)

```brightscript
' Interrupt current speech and speak new text
widget.tts().speak({
    say: "Important message",
    flush: true
})
```

### Spell Out Mode (Character-by-Character)

```brightscript
' Spell out text for passwords, codes, etc.
widget.tts().speak({
    say: "A1B2C3",
    spellOut: true
})
' Speaks: "A 1 B 2 C 3"
```

### Email Address Handling

```brightscript
' Spell out mode automatically handles emails
widget.tts().speak({
    say: "user@domain.com",
    spellOut: true
})
' Speaks: "user at domain dot com"
```

### Decimal Number Handling

```brightscript
' Spell out mode handles decimals
widget.tts().speak({
    say: "3.14",
    spellOut: true
})
' Speaks: "3 point 14"
```

### Prevent Duplicate Speech

```brightscript
' Don't speak if same text was just spoken
widget.tts().speak({
    say: "Loading...",
    dontRepeat: true
})
```

### Speak Once Mode (onceKey)

Speak text only once per cache key. Useful for announcements that should only play once per session (e.g., welcome messages, tutorial hints).

```brightscript
' Speak only once - uses explicit cache key
widget.tts().speak({
    say: "Welcome to the application!",
    onceKey: "welcome-message"
})
' Second call with same onceKey - skips (already spoken)
widget.tts().speak({
    say: "Welcome to the application!",
    onceKey: "welcome-message"  ' SKIPPED
})

' Different text, same key - still skips (key-based caching)
widget.tts().speak({
    say: "Bienvenue dans l'application!",  ' French version
    onceKey: "welcome-message"  ' SKIPPED (same key)
})
```

**Manual cache removal:**

```brightscript
' Remove specific key to allow re-speaking
m.framework.ttsService.removeOnceKey("welcome-message")

' Now speaks again
widget.tts().speak({
    say: "Welcome to the application!",
    onceKey: "welcome-message"  ' SPEAKS (key removed)
})
```

**Use cases:**
- Welcome messages on first launch
- Tutorial hints that should only play once
- One-time announcements per session
- Localized announcements (same key, different language text)

### Override Next Flush (Multi-Part Speech Protection)

Bypasses the 300ms threshold for immediate execution AND protects **all subsequent speech** from being flushed until the pending speech executes. The protection works through two internal flags:
- `preventNextFlushFlag`: Set by caller, cleared after first use
- `isPendingProtected`: Inherits protection across multiple pending replacements

This is essential for multi-part announcements like menu titles:

```brightscript
' Menu title bypasses threshold and protects first sentence
widget.tts().speak({
    say: "Page Menu, 5 items.",
    flush: true,
    preventNextFlush: true
})
' Speaks immediately (no threshold delay)
' First sentence "Page Menu, 5 items" is PROTECTED

' First menu item queues instead of interrupting
widget.tts().speak({
    say: "Home, 1 of 5",
    flush: true
})
' Result:
' - "Page Menu, 5 items" completes (protection blocked flush)
' - "Home, 1 of 5" queues and speaks after menu title
```

**How protection inheritance works with threshold:**

The mechanism uses the `isPendingProtected` flag:

1. **Menu title** with `preventNextFlush: true`:
   - Bypasses threshold → speaks immediately
   - Sets `isPendingProtected = true` to block all future flushes

2. **First menu item** with `flush: true`:
   - `isPendingProtected` blocks the flush → item becomes PENDING (300ms threshold)
   - Flag remains true, continues blocking

3. **Rapid menu navigation**:
   - All items have flush blocked by `isPendingProtected`
   - Each item replaces pending speech within threshold
   - Last item speaks after 300ms of inactivity
   - When pending executes, `isPendingProtected` is cleared

**Example: Menu title + rapid navigation**
```brightscript
' Menu opens - title speaks immediately and is protected
widget.tts().speak({ say: "Page Menu, 5 items.", preventNextFlush: true })
' Title speaks immediately, isPendingProtected = true

' User immediately navigates (rapid focus changes)
widget.tts().speak({ say: "Home, 1 of 5", flush: true })       ' Flush blocked by isPendingProtected → PENDING
widget.tts().speak({ say: "Settings, 2 of 5", flush: true })   ' Flush blocked by isPendingProtected → Replaces "Home"
widget.tts().speak({ say: "About, 3 of 5", flush: true })      ' Flush blocked by isPendingProtected → Replaces "Settings"
' User stops at "About"
' After 300ms: "About, 3 of 5" speaks, isPendingProtected cleared
```

**Note:** Text is spoken as one utterance; it is not split into sentences. Text longer than 50 characters is always spoken with flush (it interrupts the current speech), unless a `preventNextFlush` protection is active. A period alone does not force a flush, so titles like "Dr. Strange" or numbers like "4.5" behave like any other short text.

### Sentence Secure (Rapid Navigation Protection)

The TTS service automatically prevents speech pile-up during rapid navigation (e.g., fast menu scrolling) using a **300 ms one-shot debounce timer** that is restarted by every call:

```brightscript
' User rapidly navigates through menu items
widget.tts().speak({ say: "Menu item 1" })  ' Pending (300ms delay)
widget.tts().speak({ say: "Menu item 2" })  ' Replaces item 1
widget.tts().speak({ say: "Menu item 3" })  ' Replaces item 2
widget.tts().speak({ say: "Menu item 4" })  ' Replaces item 3
' After 300ms of no new calls: "Menu item 4" is spoken (the last one)
```

**How it works:**
- ALL TTS calls (both flush=true and flush=false) store speech as "pending" and reset a 300ms timer
- If another call comes within 300ms, it replaces the pending speech
- After 300ms of inactivity, the last pending speech is spoken
- `preventNextFlush: true` bypasses threshold and speaks immediately, plus protects from next flush
- Uses a one-shot SceneGraph Timer node (`repeat = false`), started only when there is pending speech

## API Reference

### widget.tts().speak(config)

`widget.tts()` returns the `TtsService` instance; `speak(config)` speaks text through it.

**Parameters:**

- `config` (object) - TTS configuration object
  - `say` (string | function | array) - Text to speak (required unless `position` or `state` is given)
    - **String**: Plain text or interpolated text with `@viewModelState.key` or `$context.property` patterns
    - **Function**: Called with context scope if provided, must return string
    - **Array**: Parts (strings and/or functions) joined with `", "`; empty parts are skipped
    - A part that is exactly an `@l10n.path` key is translated via `i18nService` (no context needed)
  - `role` (string) - Role appended after `say`, looked up in `l10n.tts.roles` (optional)
  - `state` (boolean | string) - `true`/`false` → `l10n.tts.states.on`/`off`, or a key of `l10n.tts.states` (optional)
  - `position` (array) - `[zeroBasedIndex, count]` → `l10n.tts.position`, default `"{index} of {count}"` (optional)
  - `context` (object) - Context for string interpolation (optional, widget or any object with viewModelState)
  - `flush` (boolean) - Interrupt current speech (default: false)
  - `spellOut` (boolean) - Spell out character-by-character (default: false)
  - `preventNextFlush` (boolean) - Bypass threshold AND protect from next flush (default: false)
  - `dontRepeat` (boolean) - Skip if same as last speech (default: false)
  - `onceKey` (string) - Cache key for speak-once mode. If provided, speech is cached and skipped on subsequent calls with same key (optional)

**Examples:**

```brightscript
' Plain string (no context needed)
widget.tts().speak({
    say: "Menu opened",
    flush: true,
    dontRepeat: true
})

' String interpolation with context
widget.tts().speak({
    say: "Selected @currentItem.name",
    context: widget  ' or m in widget scope
})

' String interpolation - context properties
widget.tts().speak({
    say: "Focus on widget $id",
    context: m
})

' Function with context
widget.tts().speak({
    say: function() as string
        return "Score: " + Str(m.viewModelState.score)
    end function,
    context: m,
    flush: true
})
```

## Framework Service API

The TTS service is accessible at `framework.ttsService` for advanced use cases.

### Methods

#### speak(config)

Main TTS function (`widget.tts()` returns this same service).

```brightscript
framework.ttsService.speak({
    say: "Hello",
    flush: true
})
```

#### stopSpeech()

Immediately stops all speech and cancels pending speech.

```brightscript
framework.ttsService.stopSpeech()
```

#### enable() / disable()

App-level switch (`isEnabled`, default `true`). These only flip `isEnabled`; they do not depend on the device setting.

- `disable()` stops current and pending speech first, then turns the service off.
- `enable()` turns it back on. It can be called while the device screen reader is off; speech starts as soon as the user turns the screen reader on.

```brightscript
framework.ttsService.disable()  ' Stop speech, service off
framework.ttsService.enable()   ' Service on again

' Toggle
if framework.ttsService.isEnabled
    framework.ttsService.disable()
else
    framework.ttsService.enable()
end if
```

Speech is produced only while **both** are true: `isEnabled` and the device screen reader (Audio Guide) is on. See [Device AudioGuide Integration](#device-audioguide-integration).

#### setSymbolDictionary(dictionary)

Replaces the base symbol dictionary. `l10n.tts.symbols` (see [Localization](#localization)) is still applied on top of it.

```brightscript
' Hungarian localization
framework.ttsService.setSymbolDictionary({
    "@": "kukac",
    ".": "pont",
    "-": "kötőjel"
})
```

#### removeOnceKey(key)

Removes a specific key from the speak-once cache, allowing text with that key to be spoken again.

**Parameters:**
- `key` (string) - The onceKey to remove from cache

```brightscript
' Remove specific key
framework.ttsService.removeOnceKey("welcome-message")

' Now this will speak again
widget.tts().speak({ say: "Welcome!", onceKey: "welcome-message" })
```

#### clearOnceCache()

Clears the entire speak-once cache, allowing all previously cached speeches to be spoken again.

```brightscript
' Clear all cached keys (e.g., on app restart or user logout)
framework.ttsService.clearOnceCache()
```

## Spell Out Mode Details

The `spellOut` mode intelligently processes different text patterns:

### Symbol Replacement

Symbols are replaced with spoken words using a localized dictionary:

```brightscript
widget.tts().speak({
    say: "@#$",
    spellOut: true
})
' Speaks: "at hash dollar"
```

**Default Symbol Dictionary:**

- `@` → "at"
- `.` → "dot"
- `-` → "dash"
- `_` → "underscore"
- `#` → "hash"
- `$` → "dollar"
- `%` → "percent"
- `&` → "and"
- `*` → "star"
- `+` → "plus"
- `=` → "equals"
- `/` → "slash"
- `\` → "backslash"
- `|` → "pipe"
- `~` → "tilde"
- `^` → "caret"
- `<` → "less than"
- `>` → "greater than"
- `(` → "open paren"
- `)` → "close paren"
- `[` → "open bracket"
- `]` → "close bracket"
- `{` → "open brace"
- `}` → "close brace"
- `,` → "comma"
- `:` → "colon"
- `;` → "semicolon"

### Email Detection

Emails are automatically detected and processed:

```brightscript
widget.tts().speak({
    say: "support@company.com",
    spellOut: true
})
' Speaks: "support at company dot com"
```

### Decimal Number Detection

Decimal numbers use "point" instead of "dot":

```brightscript
widget.tts().speak({
    say: "3.14159",
    spellOut: true
})
' Speaks: "3 point 14159"
```

### Regular Text

Regular text is spelled character-by-character with spaces:

```brightscript
widget.tts().speak({
    say: "ABC",
    spellOut: true
})
' Speaks: "A B C"
```

## Localization

### Symbol Pronunciation from l10n (recommended)

`l10n.tts.symbols` is applied on top of the symbol dictionary automatically, per key. Spell-out follows language changes without extra calls:

```brightscript
' In the translation file
{
    tts: {
        symbols: {
            "@": "kukac",
            ".": "pont"
        }
    }
}
' processSpellOutMode("user@domain.com") -> "user kukac domain pont com"
' Symbols missing from l10n.tts.symbols keep their dictionary name ("#" -> "hash")
```

The same `l10n.tts` object holds the phrase vocabulary (`position`, `roles`, `states`), see [Phrase Composition](#phrase-composition-say--role--state--position).

### Customizing Symbol Pronunciation in Code

`setSymbolDictionary()` replaces the base dictionary (`l10n.tts.symbols` still wins per key):

```brightscript
' Spanish localization
framework.ttsService.setSymbolDictionary({
    "@": "arroba",
    ".": "punto",
    "-": "guión",
    "#": "numeral"
})
```

### Complete Dictionary Replacement

```brightscript
' Replace entire dictionary
framework.ttsService.setSymbolDictionary({
    "@": "at sign",
    ".": "period"
    ' ... add only symbols you need
})
```

## Use Cases

### Accessible Navigation

```brightscript
function onFocusChanged(hasFocus as boolean)
    if hasFocus
        m.tts().speak({
            say: m.title,
            flush: true
        })
    end if
end function
```

### Form Field Validation

```brightscript
function validateEmail(email as string)
    if not isValidEmail(email)
        m.tts().speak({
            say: "Invalid email address",
            flush: true
        })
    end if
end function
```

### Password Entry

```brightscript
function onPasswordCharEntered(char as string)
    m.tts().speak({
        say: char,
        spellOut: true,
        flush: true
        dontRepeat: false  ' Allow same character twice
    })
end function
```

### Loading States

```brightscript
function showLoading()
    m.tts().speak({
        say: "Loading content",
        dontRepeat: true,
        preventNextFlush: true  ' Let it finish
    })
end function
```

### Menu Navigation

```brightscript
function onMenuItemFocused(item as object)
    m.tts().speak({
        say: item.title + ", " + item.description,
        flush: true,
        dontRepeat: true
    })
end function
```

## Device AudioGuide Integration

The TTS service integrates with Roku's native AudioGuide system:

### Runtime Detection

The device setting can change while the app runs (for example with the `*` shortcut), so the service does not cache it. `speak()` checks `roDeviceInfo.isAudioGuideEnabled()` on every call:

- Screen reader off: `speak()` does nothing (no pending speech, `onceKey` is not consumed). The service stays enabled.
- Screen reader turned on later: the next `speak()` works, no re-initialization needed.

There is no public field for the device state; read it with `CreateObject("roDeviceInfo").isAudioGuideEnabled()` if the app needs it.

### Native AudioGuide Control

Controlled by the framework config `allowNativeAudioGuide` (default `true`):

- `true`: the service never touches `rootNode.muteAudioGuide`; the native AudioGuide keeps reading focusable nodes next to the custom speech.
- `false`: the service mutes the native AudioGuide on the root node **only while** `isEnabled` is true **and** the device screen reader is on. In every other case it is unmuted, so the native AudioGuide takes over again when the app calls `disable()`.

```brightscript
rootNode.muteAudioGuide = isEnabled and deviceScreenReaderOn   ' only when allowNativeAudioGuide = false
```

The mute is synchronized in `init()`, `enable()`, `disable()` and on every active `speak()`. The `muteAudioGuide` property is **inherited** by all child nodes.

## Best Practices

1. **Device setting decides** - Speech only happens while the user has the screen reader (Audio Guide) on; it can be switched at any time and the service follows
2. **Use `flush: true` for important messages** - Ensures user hears critical information
3. **Use `dontRepeat: true` for repetitive actions** - Prevents annoying duplicate speech
4. **Use `preventNextFlush` sparingly** - Only for critical first sentences
5. **Trust sentence secure for navigation** - No need for `flush` on every focus change; service automatically skips during rapid navigation
6. **Use `spellOut` for:**
   - Passwords and security codes
   - Email addresses
   - File names with special characters
   - Abbreviations and acronyms
7. **Localize symbol dictionary** - Provide native language symbol names
8. **Keep messages concise** - Long messages can be interrupted or ignored
9. **Provide context** - "Menu opened" vs just "Opened"; use `role` / `state` / `position` instead of hand-built strings so the wording is localizable
10. **Respect user's AudioGuide setting** - Don't try to override device-level disable

## Performance Considerations

- TTS service is lightweight and available on all widgets
- No event system overhead (direct service access)
- Native `roAudioGuide` API is optimized by Roku
- `dontRepeat` flag reduces unnecessary TTS calls
- Sentence secure prevents speech queue pile-up during rapid navigation
- Debounce uses a 300 ms one-shot SceneGraph Timer node; it only runs while speech is pending
- `speak()` returns early while the device screen reader is off
- Service can be globally switched with `enable()` / `disable()`
- Native AudioGuide mute is managed by the service when `allowNativeAudioGuide` is `false`

## Debugging

In debug builds (`bs_const` `debug=true`) every `speak()` call logs the composed phrase:

```
[ROTOR][TTS] say: Play, button (active: true)
```

`active` is `isEnabled AND device screen reader on`. The line is logged even when the screen reader is off (`active: false`), so the wording can be checked without turning Audio Guide on. The log is compiled out of non-debug builds; there is no runtime switch for it.

## Comparison with Beam TTS

Rotor's TTS implementation is simpler than Beam's 3-layer architecture:

| Feature | Beam TTS | Rotor TTS |
|---------|----------|-----------|
| Architecture | 3 layers (Node + Router + Events) | 2 layers (Service + Decorator) |
| Access | Event-based | Direct widget access |
| Component Processing | Yes | No (service-level only) |
| Symbol Handling | Yes | Yes |
| Flush Control | Yes | Yes |
| Override Protection | Yes | Yes |
| Decimal Handling | Yes | Yes |

Rotor's simpler architecture provides the same core functionality with less complexity.
