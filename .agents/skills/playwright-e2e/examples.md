# Playwright E2E Test Examples

Complete examples for common testing scenarios in the design system.

## Button Component

```typescript
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-actions-button--primary')
  })

  test('should render with correct text', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button', { name: 'Primary' })
    
    await expect(button).toBeVisible()
    await expect(button).toHaveText('Primary')
  })

  test('should be clickable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await button.click()
    // Add assertion for click result
  })

  test('should show hover state', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await button.hover()
    await expect(button).toHaveAttribute('data-hover', 'true')
  })

  test('should be focusable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await button.focus()
    await expect(button).toBeFocused()
  })

  test('should have no a11y violations', async ({ page }) => {
    await injectAxe(page)
    await checkA11y(page, '#storybook-preview-iframe', {
      detailedReport: true,
    })
  })
})
```

## Disabled Button State

```typescript
test.describe('Button - Disabled', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-actions-button--disabled')
  })

  test('should be disabled', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await expect(button).toBeDisabled()
  })

  test('should not be clickable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    // Attempt click should not trigger action
    await button.click({ force: true })
    // Verify no action occurred
  })
})
```

## Input Component

```typescript
import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Input', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-forms-input--default')
  })

  test('should render with label', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    const label = frame.getByText('Email')
    
    await expect(input).toBeVisible()
    await expect(label).toBeVisible()
  })

  test('should accept input', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    
    await input.fill('test@example.com')
    await expect(input).toHaveValue('test@example.com')
  })

  test('should show placeholder', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByPlaceholder('Enter email')
    
    await expect(input).toBeVisible()
  })

  test('should be focusable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    
    await input.focus()
    await expect(input).toBeFocused()
  })

  test('should clear input', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    
    await input.fill('test@example.com')
    await input.clear()
    await expect(input).toHaveValue('')
  })

  test('should have no a11y violations', async ({ page }) => {
    await injectAxe(page)
    await checkA11y(page, '#storybook-preview-iframe', {
      detailedReport: true,
    })
  })
})
```

## Input Error State

```typescript
test.describe('Input - Error State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-forms-input--error')
  })

  test('should show error message', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const errorMessage = frame.getByText('Invalid email format')
    
    await expect(errorMessage).toBeVisible()
  })

  test('should have aria-invalid', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('should have aria-describedby', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const input = frame.getByLabel('Email')
    
    await expect(input).toHaveAttribute('aria-describedby')
  })
})
```

## Table Component

```typescript
import { test, expect } from '@playwright/test'

test.describe('Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-data-table--default')
  })

  test('should render table headers', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const headers = frame.locator('thead th')
    
    await expect(headers).toHaveCount(3)
    await expect(headers.nth(0)).toHaveText('Name')
    await expect(headers.nth(1)).toHaveText('Email')
    await expect(headers.nth(2)).toHaveText('Status')
  })

  test('should render table rows', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const rows = frame.locator('tbody tr')
    
    await expect(rows).toHaveCount(5)
  })

  test('should be sortable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const nameHeader = frame.getByRole('columnheader', { name: 'Name' })
    
    await nameHeader.click()
    // Verify sorting occurred
    const firstRow = frame.locator('tbody tr').first()
    await expect(firstRow.locator('td').first()).toHaveText('Alice')
  })

  test('should support keyboard navigation', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const table = frame.getByRole('table')
    
    await table.focus()
    await page.keyboard.press('ArrowDown')
    // Verify focus moved
  })
})
```

## Dialog/Modal Component

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-overlay-dialog--default')
  })

  test('should open dialog on button click', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const openButton = frame.getByRole('button', { name: 'Open Dialog' })
    
    await openButton.click()
    const dialog = frame.getByRole('dialog')
    await expect(dialog).toBeVisible()
  })

  test('should close on Escape key', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const openButton = frame.getByRole('button', { name: 'Open Dialog' })
    
    await openButton.click()
    const dialog = frame.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible()
  })

  test('should close on backdrop click', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const openButton = frame.getByRole('button', { name: 'Open Dialog' })
    
    await openButton.click()
    const dialog = frame.getByRole('dialog')
    await expect(dialog).toBeVisible()
    
    // Click outside dialog
    await frame.locator('body').click({ position: { x: 10, y: 10 } })
    await expect(dialog).not.toBeVisible()
  })

  test('should trap focus within dialog', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const openButton = frame.getByRole('button', { name: 'Open Dialog' })
    
    await openButton.click()
    const dialog = frame.getByRole('dialog')
    
    const closeButton = dialog.getByRole('button', { name: 'Close' })
    await closeButton.focus()
    
    await page.keyboard.press('Tab')
    // Verify focus stays within dialog
  })

  test('should have aria-modal attribute', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const openButton = frame.getByRole('button', { name: 'Open Dialog' })
    
    await openButton.click()
    const dialog = frame.getByRole('dialog')
    
    await expect(dialog).toHaveAttribute('aria-modal', 'true')
  })
})
```

## Dropdown/Select Component

```typescript
import { test, expect } from '@playwright/test'

test.describe('Select', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-forms-select--default')
  })

  test('should open dropdown on click', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const trigger = frame.getByRole('combobox')
    
    await trigger.click()
    const listbox = frame.getByRole('listbox')
    await expect(listbox).toBeVisible()
  })

  test('should select option', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const trigger = frame.getByRole('combobox')
    
    await trigger.click()
    const option = frame.getByRole('option', { name: 'Option 1' })
    await option.click()
    
    await expect(trigger).toHaveText('Option 1')
  })

  test('should filter options when searchable', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const trigger = frame.getByRole('combobox')
    
    await trigger.click()
    const input = frame.getByRole('searchbox')
    await input.fill('Opt')
    
    const options = frame.getByRole('option')
    await expect(options).toHaveCount(2)
  })

  test('should support keyboard navigation', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const trigger = frame.getByRole('combobox')
    
    await trigger.focus()
    await page.keyboard.press('ArrowDown')
    
    const listbox = frame.getByRole('listbox')
    await expect(listbox).toBeVisible()
  })
})
```

## Screenshot Testing

```typescript
import { test, expect } from '@playwright/test'

test.describe('Visual Regression', () => {
  test('button should match snapshot', async ({ page }) => {
    await page.goto('/?path=/story/components-actions-button--primary')
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await expect(button).toHaveScreenshot('button-primary.png', {
      maxDiffPixels: 100,
    })
  })

  test('button hover state should match snapshot', async ({ page }) => {
    await page.goto('/?path=/story/components-actions-button--primary')
    const frame = page.frameLocator('#storybook-preview-iframe')
    const button = frame.getByRole('button')
    
    await button.hover()
    await expect(button).toHaveScreenshot('button-hover.png')
  })

  test('input with error should match snapshot', async ({ page }) => {
    await page.goto('/?path=/story/components-forms-input--error')
    const frame = page.frameLocator('#storybook-preview-iframe')
    const container = frame.locator('.input-container')
    
    await expect(container).toHaveScreenshot('input-error.png')
  })
})
```

## Testing Async Loading States

```typescript
import { test, expect } from '@playwright/test'

test.describe('Async Component', () => {
  test('should show loading state', async ({ page }) => {
    await page.goto('/?path=/story/components-data-asyncloader--default')
    const frame = page.frameLocator('#storybook-preview-iframe')
    
    const loadingSpinner = frame.getByRole('status', { name: /loading/i })
    await expect(loadingSpinner).toBeVisible()
  })

  test('should show content after loading', async ({ page }) => {
    await page.goto('/?path=/story/components-data-asyncloader--default')
    const frame = page.frameLocator('#storybook-preview-iframe')
    
    const content = frame.getByTestId('loaded-content')
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('should show error state on failure', async ({ page }) => {
    await page.goto('/?path=/story/components-data-asyncloader--error')
    const frame = page.frameLocator('#storybook-preview-iframe')
    
    const errorMessage = frame.getByText(/error occurred/i)
    await expect(errorMessage).toBeVisible()
  })
})
```

## Form Validation Testing

```typescript
import { test, expect } from '@playwright/test'

test.describe('Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?path=/story/components-forms-form--default')
  })

  test('should show validation errors on submit', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const submitButton = frame.getByRole('button', { name: 'Submit' })
    
    await submitButton.click()
    
    const errorMessages = frame.locator('[role="alert"]')
    await expect(errorMessages).toHaveCount(3)
  })

  test('should clear error on valid input', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const emailInput = frame.getByLabel('Email')
    
    await emailInput.fill('invalid-email')
    await emailInput.blur()
    
    const error = frame.getByRole('alert').filter({ hasText: 'Invalid email' })
    await expect(error).toBeVisible()
    
    await emailInput.fill('valid@email.com')
    await emailInput.blur()
    
    await expect(error).not.toBeVisible()
  })

  test('should disable submit button when invalid', async ({ page }) => {
    const frame = page.frameLocator('#storybook-preview-iframe')
    const submitButton = frame.getByRole('button', { name: 'Submit' })
    
    await expect(submitButton).toBeDisabled()
  })
})
```

## Multi-Story Testing

```typescript
import { test, expect } from '@playwright/test'

const stories = [
  { name: 'Primary', path: '/?path=/story/components-button--primary' },
  { name: 'Secondary', path: '/?path=/story/components-button--secondary' },
  { name: 'Disabled', path: '/?path=/story/components-button--disabled' },
  { name: 'Loading', path: '/?path=/story/components-button--loading' },
]

test.describe('Button - All Variants', () => {
  for (const story of stories) {
    test(`should render ${story.name} variant`, async ({ page }) => {
      await page.goto(story.path)
      const frame = page.frameLocator('#storybook-preview-iframe')
      const button = frame.getByRole('button')
      
      await expect(button).toBeVisible()
    })
  }
})
```
