# AI Rules for {{project-name}}

{{project-description}}

## TESTING

### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.

##### Testing Angular Presentational Components with Vitest

When testing Angular components that rely on template rendering and DOM interactions, follow these patterns:

- **Initialize TestBed explicitly** - Add `TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting())` in `beforeAll()` of each test file. The global vitest.setup.ts initialization doesn't persist across Vitest's test isolation boundaries.
- **Use ComponentFixture** - Create components with `TestBed.createComponent()` to get a fixture that provides access to both the component instance and the rendered DOM.
- **Set signal inputs** - Use `fixture.componentRef.setInput('inputName', value)` to set input values on components that use Angular's `input()` signals.
- **Trigger change detection** - Call `fixture.detectChanges()` after setting inputs or making state changes to update the rendered DOM.
- **Query the DOM** - Use `fixture.nativeElement.querySelector()` to test rendered output. This gives you direct access to the HTML elements for verifying classes, attributes, and content.
- **Clean up** - Call `fixture?.destroy()` and `TestBed.resetTestingModule()` in `afterEach()` to ensure proper cleanup between tests.

Example:

```typescript
describe("MyComponent", () => {
  let fixture: ComponentFixture<MyComponent>;
  let component: MyComponent;

  beforeAll(() => {
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MyComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  it("should render with input", () => {
    fixture.componentRef.setInput("title", "Test");
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector(".title");
    expect(element?.textContent).toBe("Test");
  });
});
```

### Guidelines for E2E

#### PLAYWRIGHT

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs
