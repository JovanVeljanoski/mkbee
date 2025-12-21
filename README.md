# Welcome

Македонска пчелка (Macedonian Bee) is a clone of the popular New York Times Spelling Bee game, specifically tailored for the Macedonian language. The goal is to form as many words as possible using 7 letters from a honeycomb, ensuring that the center letter is used in every word.

# Local dev setup

This project uses `conda`/`mamba` to manage both Python and Node.js environments.

### 1. Environment Installation
To set up the environment, run:
```bash
mamba env create -f environment.yaml
mamba activate mkbee
```

### 2. Project Installation
Once the environment is active, install the Node dependencies:
```bash
npm install
```

### 3. Running the App
To start the development server:
```bash
npm run dev
```

### 4. Running Tests
To execute the unit tests:
```bash
npm test
```

### 5. Linting
To check the code for potential issues:
```bash
npm run lint
```

> **Note:** All `npm` or `npx` commands should be run within the active `mkbee` environment. If you prefer using your own Node.js version manager (like `nvm` or `fnm`), you can skip the mamba setup and run the standard Node commands directly.

# Dictionary

The Macedonian dictionary used in this app has been sourced from [placeholder]. It is processed and filtered to provide a high-quality word list suitable for the game.

# Contributing

Contributions are welcome! If you have ideas for new features, UI improvements, or better word lists, feel free to open an issue or submit a pull request.

Please follow best practices:
- Ensure your code passes linting: `npm run lint`
- Run existing tests before submitting: `npm test`
- Keep components modular and follow the existing project structure.
