# Code Standards

The rules apply to all code in `app/`.

## 1. Write All Code In English

Use English for identifiers, comments, error messages, and documentation in source files.

**Bad:**

```ts
const usuarioAtivo = true;
function calcularTotal() {
  return 10;
}

```

**Good:**

```ts
const activeUser = true;
function calculateTotal() {
  return 10;
}

```

## 2. Use camelCase For Variables, Methods and Functions

Variables, methods, and functions must start with a lowercase letter and use camelCase.

**Bad:**

```ts
const User_Name = "Ada";
function Get_Total() {
  return 10;
}

```

**Good:**

```ts
const userName = "Ada";
function getTotal() {
  return 10;
}

```

## 3. Use PascalCase For Classes and Interfaces

Classes, interfaces, and types must start with an uppercase letter and use PascalCase.

**Bad:**

```ts
interface userProfile {
    name: string;
}

class order_service {}

```

**Good:**

```ts
interface UserProfile {
    name: string;
}

class OrderService {}

```

## 4. Avoid Magic Numbers

Do not place unexplained numeric or string values directly in logic. Extract them into named constants with uppercase letters and underscores (SCREAMING_SNAKE_CASE).

**Bad:**

```ts
if (items.length > 50) {
  throw new Error("Too many items");
}

```

**Good:**

```ts
const MAX_CART_ITEMS = 50;

if (items.length > MAX_CART_ITEMS) {
  throw new Error("Too many items");
}

```

## 5. Use `const` By Default, `let` When Needed, And Never `var`

Always declare variables with `const` to prevent accidental reassignment. Only use `let` if you explicitly need to mutate the variable later. Never use `var`.

**Bad:**

```ts
var isActive = true;
let maxLimit = 100; // Value is never changed later

```

**Good:**

```ts
const isActive = true;
const maxLimit = 100;
let retryCount = 0; // Use let because it will be incremented

```

## 6. Use Early Returns To Avoid Deep Nesting

Return early to handle edge cases, errors, or invalid states. This keeps the "happy path" logic at the top level of indentation, making the code much easier to read.

**Bad:**

```ts
function processUser(user: User) {
  if (user) {
    if (user.isActive) {
      if (!user.isBanned) {
        // Main logic here
        return performAction(user);
      }
    }
  }
  return null;
}

```

**Good:**

```ts
function processUser(user: User) {
  if (!user || !user.isActive || user.isBanned) {
    return null;
  }
  
  // Main logic here
  return performAction(user);
}

```

## 7. Write Descriptive Names Over Abbreviations

Avoid single-letter or cryptic abbreviations. Code is read far more often than it is written, so clarity is more important than brevity. (Exceptions apply for common iterators like `i` or `j` in small loops).

**Bad:**

```ts
const u = fetchUser();
const err = false;
function calc(d: any) {}

```

**Good:**

```ts
const currentUser = fetchUser();
const hasError = false;
function calculateDiscount(data: any) {}

```

## 8. Avoid The `any` Type In TypeScript

Using `any` disables TypeScript's type checking. Always define proper interfaces or types. If the type is truly unknown ahead of time, use `unknown` and narrow it down.

**Bad:**

```ts
function handleData(payload: any) {
  console.log(payload.name);
}

```

**Good:**

```ts
interface UserPayload {
  name: string;
}

function handleData(payload: UserPayload) {
  console.log(payload.name);
}

```
