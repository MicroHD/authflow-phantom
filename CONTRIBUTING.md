# Contributing to AuthFlow Phantom

We love your input! We want to make contributing to AuthFlow Phantom as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## We Develop with GitHub

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## We Use [Bun](https://bun.sh/)

We use Bun for package management and running scripts. Make sure you have it installed before contributing.

## We Use [Github Flow](https://guides.github.com/introduction/flow/index.html)

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Any contributions you make will be under the MIT Software License

In short, when you submit code changes, your submissions are understood to be under the same [MIT License](http://choosealicense.com/licenses/mit/) that covers the project. Feel free to contact the maintainers if that's a concern.

## Report bugs using GitHub's [issue tracker](https://github.com/yourusername/authflow-phantom/issues)

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/authflow-phantom/issues/new); it's that easy!

## Write bug reports with detail, background, and sample code

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can.
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Development Process

1. Clone the repository:
```bash
git clone https://github.com/yourusername/authflow-phantom.git
cd authflow-phantom
```

2. Install dependencies:
```bash
bun install
```

3. Create a new branch:
```bash
git checkout -b feature/your-feature-name
```

4. Make your changes and commit them:
```bash
git commit -m "feat: add your feature"
```

5. Push to your fork:
```bash
git push origin feature/your-feature-name
```

6. Create a Pull Request

## Testing

We use Jest for testing. Run the tests with:

```bash
bun test
```

For watching mode:

```bash
bun test:watch
```

For coverage:

```bash
bun test:cov
```

## Code Style

We use ESLint and Prettier for code formatting. Run the linter with:

```bash
bun run lint
```

Format your code with:

```bash
bun run format
```

## Documentation

- Update the README.md with details of changes to the interface
- Update the CHANGELOG.md with details of changes
- Add JSDoc comments to new functions and classes
- Update API documentation if necessary

## License

By contributing, you agree that your contributions will be licensed under its MIT License. 