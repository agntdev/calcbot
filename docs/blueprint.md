# Calculator Bot — Bot specification

**Archetype:** custom

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

A Telegram bot that evaluates mathematical expressions and returns numeric results with configurable precision. Supports arithmetic operations, common math functions, and group chat interactions with /calc or @botname invocation.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- students
- professionals
- casual users

## Success criteria

- Correctly evaluates 99.9% of valid expressions within 1 second
- Returns clear error messages for invalid inputs
- Maintains user-specific precision settings across sessions

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Display brief usage help and available commands
- **/help** (command, actor: user, command: /help) — Show list of supported operators and example expressions
- **/precision** (command, actor: user, command: /precision) — Set preferred decimal precision for results
- **Set Precision** (button, actor: user, callback: precision:configure) — Open precision configuration dialog

## Flows

### Expression Evaluation
_Trigger:_ User sends math expression

1. Receive expression via direct message or group chat
2. Validate syntax and operands
3. Calculate result with configured precision
4. Return numeric answer or error message

_Data touched:_ Expression, Result

### Precision Configuration
_Trigger:_ /precision N or button click

1. Parse numeric precision value
2. Validate range (1-15 digits)
3. Update user-specific setting
4. Confirm change with example calculation

_Data touched:_ User

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **User** _(retention: persistent)_ — Telegram user with session-specific settings
  - fields: telegram_id, preferred_precision, rate_limit_counter
- **Expression** _(retention: session)_ — Mathematical input string to evaluate
  - fields: raw_text, normalized_expression
- **Result** _(retention: session)_ — Computed numeric output with error handling
  - fields: numeric_value, error_message, precision_used

## Integrations

- **Telegram** (required) — Bot API messaging and group chat interactions
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure rate-limit thresholds
- Set default precision value
- Define supported math functions list

## Notifications

- No external notifications required - all responses are in-chat

## Permissions & privacy

- Only store user ID and precision preference
- Do not retain expression history beyond session
- Rate-limit data purged after 24h

## Edge cases

- Division by zero
- Invalid function nesting
- Precision values outside 1-15 range
- Non-mathematical text input
- Flood of rapid expressions

## Required tests

- Verify sin(π/2) returns 1.0 with default precision
- Test error handling for '2++2' syntax
- Confirm group chat @botname invocation works

## Assumptions

- Default precision is 8 significant digits
- Group responses only trigger on /calc or @botname
- No CAS capabilities implemented
