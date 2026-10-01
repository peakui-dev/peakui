# Playwright E2E Reference

Advanced patterns, API reference, and troubleshooting for E2E testing.

## Playwright Config

This is the config the repository actually has, at `apps/storybook/playwright.config.ts`.
It lives in the app, not the repo root: Storybook is the app's dependency and the app knows
its own port.

```typescript
import {defineConfig, devices} from "@playwright/test";

const PORT = Number(process.env.STORYBOOK_PORT ?? 6007);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: {...devices["Desktop Chrome"]},
    },
  ],
  reporter: process.env.CI ? "html" : "list",
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  webServer: {
    command: process.env.CI
      ? `pnpm exec http-server storybook-static --port ${PORT} --silent`
      : "pnpm dev",
    reuseExistingServer: !process.env.CI,
    url: BASE_URL,
  },
  workers: process.env.CI ? 1 : undefined,
});
```

Three things to keep in mind:

- `testDir` is `./e2e`, relative to the app.
- The dev server command is `pnpm dev`. There is no `pnpm run storybook` script.
- The port comes from `STORYBOOK_PORT`, defaulting to 6007. Port 6007 is a default, not a
  guarantee — another project may hold it, so run `STORYBOOK_PORT=<free> pnpm test:e2e`
  rather than assuming.

## Locator Methods Reference

### Role-Based Locators (Preferred)

```typescript
// Button
getByRole("button", {name: "Submit"});
getByRole("button", {name: /submit/i}); // Regex
getByRole("button", {pressed: true}); // Toggle state

// Link
getByRole("link", {name: "Learn more"});

// Heading
getByRole("heading", {name: "Welcome", level: 1});

// Input
getByRole("textbox", {name: "Email"});
getByRole("searchbox");
getByRole("spinbutton"); // Number input
getByRole("checkbox", {name: "Accept terms"});
getByRole("radio", {name: "Option 1"});

// Select/Dropdown
getByRole("combobox", {name: "Country"});
getByRole("listbox");
getByRole("option", {name: "United States"});

// Dialog
getByRole("dialog", {name: "Confirm"});
getByRole("alertdialog");

// Table
getByRole("table");
getByRole("row");
getByRole("cell");
getByRole("columnheader", {name: "Name"});

// Navigation
getByRole("navigation");
getByRole("menu");
getByRole("menuitem");

// Status/Alert
getByRole("status"); // aria-live="polite"
getByRole("alert"); // aria-live="assertive"

// Tab
getByRole("tab", {name: "Settings"});
getByRole("tablist");
getByRole("tabpanel");
```

### Text-Based Locators

```typescript
getByText("Submit");
getByText(/submit/i); // Case insensitive
getByText(/^Submit$/); // Exact match
```

### Label/Placeholder Locators

```typescript
getByLabel("Email Address");
getByLabel(/email/i);
getByPlaceholder("Enter your email");
```

### Test ID Locators

```typescript
getByTestId("submit-button");
// Requires element: data-testid="submit-button"
```

## Assertions Reference

### Visibility

```typescript
await expect(element).toBeVisible();
await expect(element).not.toBeVisible();
await expect(element).toBeHidden();
```

### State

```typescript
await expect(element).toBeEnabled();
await expect(element).toBeDisabled();
await expect(element).toBeEditable();
await expect(element).toBeReadOnly();
await expect(element).toBeFocused();
await expect(element).toBeChecked();
```

### Content

```typescript
await expect(element).toHaveText("Submit");
await expect(element).toHaveText(/submit/i);
await expect(element).toContainText("Sub");
await expect(element).toHaveValue("input value");
await expect(element).toBeEmpty();
```

### Attributes

```typescript
await expect(element).toHaveAttribute("type", "submit");
await expect(element).toHaveAttribute("disabled");
await expect(element).toHaveClass(/btn-primary/);
await expect(element).toHaveCSS("color", "rgb(0, 0, 0)");
await expect(element).toHaveId("submit-btn");
```

### Count

```typescript
await expect(elements).toHaveCount(5);
```

### Screenshots

```typescript
await expect(element).toHaveScreenshot("button.png");
await expect(element).toHaveScreenshot("button.png", {
  maxDiffPixels: 100,
  maxDiffPixelRatio: 0.01,
  animations: "disabled",
});
```

### Page/URL

```typescript
await expect(page).toHaveURL("/dashboard");
await expect(page).toHaveURL(/dashboard/);
await expect(page).toHaveTitle("My App");
```

## Actions Reference

### Click

```typescript
await element.click();
await element.click({button: "right"});
await element.click({modifiers: ["Shift"]});
await element.click({position: {x: 10, y: 10}});
await element.click({force: true}); // Skip actionability checks
await element.dblclick();
```

### Fill Input

```typescript
await input.fill("text");
await input.clear();
await input.type("text", {delay: 100}); // Simulates typing
await input.press("Enter");
await input.pressSequentially("hello");
```

### Keyboard

```typescript
await page.keyboard.press("Enter");
await page.keyboard.press("Tab");
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Control+A");
await page.keyboard.type("hello");
```

### Mouse

```typescript
await element.hover();
await element.focus();
await element.blur();
await page.mouse.click(100, 200);
await page.mouse.move(100, 200);
```

### Select

```typescript
await select.selectOption("blue");
await select.selectOption({label: "Blue"});
await select.selectOption({value: "blue"});
await select.selectOption({index: 0});
await select.selectOption(["red", "green", "blue"]); // Multiple
```

### Check/Uncheck

```typescript
await checkbox.check();
await checkbox.uncheck();
await expect(checkbox).toBeChecked();
```

### Upload

```typescript
await input.setInputFiles("path/to/file.pdf");
await input.setInputFiles(["file1.pdf", "file2.pdf"]);
```

## Waiting Strategies

### Auto-Waiting

Playwright automatically waits for elements:

```typescript
// These auto-wait for element to be actionable
await element.click();
await element.fill("text");
await expect(element).toBeVisible();
```

### Explicit Waits

```typescript
// Wait for element
await page.waitForSelector(".loaded");

// Wait for function
await page.waitForFunction(() => {
  return document.querySelector(".status").textContent === "Ready";
});

// Wait for URL
await page.waitForURL("/dashboard");

// Wait for request
await page.waitForRequest("/api/data");

// Wait for response
await page.waitForResponse("/api/data");
```

### ❌ Avoid

```typescript
// Don't use arbitrary timeouts
await page.waitForTimeout(1000); // BAD

// Use specific waits instead
await expect(element).toBeVisible({timeout: 5000}); // GOOD
```

## Fixtures

### Custom Fixtures

```typescript
// fixtures.ts
import {test as base} from "@playwright/test";

type MyFixtures = {
  authenticatedPage: Page;
};

export const test = base.extend<MyFixtures>({
  authenticatedPage: async ({page}, use) => {
    // Setup
    await page.goto("/login");
    await page.fill('[name="email"]', "user@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');
    await page.waitForURL("/dashboard");

    // Use
    await use(page);

    // Teardown (optional)
  },
});
```

### Using Custom Fixtures

```typescript
import {test, expect} from "./fixtures";

test("should show dashboard", async ({authenticatedPage}) => {
  await expect(authenticatedPage.getByText("Welcome")).toBeVisible();
});
```

## Mocking

### Mock API Responses

```typescript
test("should display mocked data", async ({page}) => {
  await page.route("/api/users", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {id: 1, name: "Alice"},
        {id: 2, name: "Bob"},
      ]),
    });
  });

  await page.goto("/users");
  const rows = page.locator("tbody tr");
  await expect(rows).toHaveCount(2);
});
```

### Mock File Upload

```typescript
test("should upload file", async ({page}) => {
  await page.route("/api/upload", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({success: true}),
    });
  });

  const input = page.getByLabel("Upload");
  await input.setInputFiles("test-file.pdf");
  await page.click('button[type="submit"]');
});
```

### Abort Requests

```typescript
test("should handle network failure", async ({page}) => {
  await page.route("/api/data", (route) => route.abort());

  await page.goto("/dashboard");
  const errorMessage = page.getByText(/error/i);
  await expect(errorMessage).toBeVisible();
});
```

## Accessibility Testing with axe-playwright

### Basic Check

```typescript
import {injectAxe, checkA11y} from "axe-playwright";

test("should have no a11y violations", async ({page}) => {
  await page.goto("/?path=/story/...");
  await injectAxe(page);
  await checkA11y(page, "#storybook-preview-iframe");
});
```

### Detailed Report

```typescript
test("should have detailed a11y report", async ({page}) => {
  await page.goto("/?path=/story/...");
  await injectAxe(page);
  await checkA11y(page, "#storybook-preview-iframe", {
    detailedReport: true,
    detailedReportOptions: {
      html: true,
    },
  });
});
```

### Custom Rules

```typescript
test("should pass custom a11y rules", async ({page}) => {
  await page.goto("/?path=/story/...");
  await injectAxe(page);
  await checkA11y(page, "#storybook-preview-iframe", {
    rules: {
      "color-contrast": {enabled: false},
    },
  });
});
```

## Debugging

### UI Mode

```bash
npx playwright test --ui
```

### Debug Mode

```bash
npx playwright test --debug
```

### Trace Viewer

```typescript
// In test
test('my test', async ({ page, context }) => {
  await context.tracing.start({ screenshots: true, snapshots: true })

  // ... test code ...

  await context.tracing.stop({ path: 'trace.zip' })
})

// View trace
npx playwright show-trace trace.zip
```

### Screenshots on Failure

Configured in `playwright.config.ts`:

```typescript
use: {
  screenshot: 'only-on-failure',
}
```

### Console Logs

```typescript
page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
page.on("pageerror", (error) => console.log("PAGE ERROR:", error.message));
```

### Slow Motion

```bash
npx playwright test --slow-mo=500
```

## Common Issues & Solutions

### Element Not Found

```typescript
// Problem: Element not visible yet
await element.click(); // Fails

// Solution: Wait for it
await element.waitFor({state: "visible"});
await element.click();

// Or use assertion (auto-waits)
await expect(element).toBeVisible();
await element.click();
```

### Flaky Tests

```typescript
// Problem: Timing issues
await page.waitForTimeout(1000); // Flaky

// Solution: Wait for specific conditions
await expect(element).toBeVisible();
await page.waitForFunction(() => window.dataLoaded);
```

### Iframe Issues

```typescript
// Problem: Can't find element in Storybook
const element = page.locator(".component"); // Wrong

// Solution: Use frameLocator
const frame = page.frameLocator("#storybook-preview-iframe");
const element = frame.locator(".component");
```

### Multiple Elements

```typescript
// Problem: Locator matches multiple elements
const button = frame.getByRole("button"); // Ambiguous

// Solution: Be more specific
const button = frame.getByRole("button", {name: "Submit"});

// Or use .first(), .nth(), .last()
const firstButton = frame.getByRole("button").first();
const secondButton = frame.getByRole("button").nth(1);
```

## Best Practices Summary

1. **Use semantic locators** - `getByRole`, `getByText`, `getByLabel`
2. **Avoid arbitrary waits** - Use `expect()` for auto-waiting
3. **Test user behavior** - Not implementation details
4. **Mock external dependencies** - No real API calls
5. **Keep tests isolated** - Each test should be independent
6. **Use test.beforeEach** - For common setup
7. **Test accessibility** - For all interactive components
8. **Name tests clearly** - "should [expected behavior]"
9. **Test all states** - Default, hover, focus, disabled, error
10. **Clean up** - Remove `test.only` before committing
