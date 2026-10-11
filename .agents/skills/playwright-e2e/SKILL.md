---
name: playwright-e2e
description: Write and review E2E tests using Playwright for Storybook components in the design system. Use when creating new E2E tests, reviewing test files, debugging failing tests, or when the user mentions Playwright, E2E testing, or asks about testing components.
metadata:
  internal: true
---

# E2E Testing with Playwright

Guide for writing E2E tests for UI components in the design system monorepo using Playwright.

## Quick Start

Tests are located in `apps/storybook/e2e/` with `.spec.ts` extension.

```typescript
import { test, expect } from '@playwright/test'

test.describe('ComponentName', () => {
  test('should render correctly', async ({ page }) => {
    await page.goto('/?path=/story/components-category-component--default')
    const frame = page.frameLocator('#storybook-preview-iframe')
    const element = frame.getByRole('button')
    await expect(element).toBeVisible()
  })
})
```

## Core Principles

1. **One component per test file** - Each `.spec.ts` tests a single component
2. **Use semantic locators** - Prefer `getByRole`, `getByText`, `getByLabel` over CSS selectors
3. **Always use frameLocator** - Storybook renders in iframe: `page.frameLocator('#storybook-preview-iframe')`
4. **Test all states** - Cover default, hover, focus, disabled, loading, error states

## Test Structure

```typescript
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('ComponentName', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/...')
  })

  // Basic render test
  test('should render with default props', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    await expect(frame.getByRole('button')).toBeVisible()
  })

  // Accessibility test
  test('should have no a11y violations', async ({ page }) => {
    await injectAxe(page)
    await checkA11y(page, '#storybook-preview-iframe', {
      detailedReport: true,
    })
  })

  // Interaction test
  test('should handle click', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    await frame.getByRole('button').click()
    // Assert result
  })
})
```

## Locator Priority

1. `getByRole()` - Best for accessibility
2. `getByText()` - For text content
3. `getByLabel()` - For form elements
4. `getByPlaceholder()` - For inputs
5. `getByTestId()` - Last resort, use `data-testid` attribute

```typescript
// ✅ Good
frame.getByRole('button', { name: 'Submit' })
frame.getByLabel('Email address')

// ❌ Avoid
frame.locator('.btn-primary')
frame.locator('#submit-button')
```

## Accessibility Testing

Always test accessibility for interactive components:

```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('should have no a11y violations', async ({ page }) => {
  await injectAxe(page)
  await checkA11y(page, '#storybook-preview-iframe', {
    detailedReport: true,
    detailedReportOptions: { html: true },
  })
})
```

## Component States Checklist

For each component, test these states:

- [ ] Default render
- [ ] Hover state
- [ ] Focus state
- [ ] Disabled state (if applicable)
- [ ] Loading state (if applicable)
- [ ] Error state (if applicable)
- [ ] Accessibility
- [ ] Keyboard navigation

```typescript
test('should show hover styles', async ({ page }) => {
  const frame = page.frameLocator('#storybook-preview-iframe')
  const button = frame.getByRole('button')
  await button.hover()
  await expect(button).toHaveClass(/hover/)
})
```

## Running Tests

```bash
# Local development (requires running Storybook)
pnpm run test:e2e

# CI (builds Storybook first)
pnpm run test:e2e:ci

# Run specific test file
npx playwright test e2e/Button.spec.ts

# Run with UI mode
npx playwright test --ui
```

## Anti-Patterns

| ❌ Avoid | ✅ Use Instead |
|----------|---------------|
| `page.waitForTimeout(1000)` | `await expect(element).toBeVisible()` |
| `test.only` in commits | Remove before committing |
| CSS-in-JS class selectors | `data-testid` or semantic locators |
| Real API requests | Mock data |
| `page.locator('.class')` | `page.getByRole('button')` |

## Additional Resources

- For complete code examples, see [examples.md](examples.md)
- For advanced patterns and API reference, see [reference.md](reference.md)

## Checklist Before Committing

- [ ] Test file follows naming convention: `ComponentName.spec.ts`
- [ ] All component states are tested
- [ ] Accessibility test included for interactive components
- [ ] No `test.only` left in code
- [ ] Semantic locators used (not fragile CSS selectors)
- [ ] Mock data used instead of real API calls
