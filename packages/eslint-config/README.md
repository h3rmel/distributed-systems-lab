# @distributed-systems-lab/eslint-config

Shared ESLint 9 flat configs for the monorepo. Four presets targeting different runtime environments.

## Configs

| Export     | Target         | Key Rules                                                                                 |
| ---------- | -------------- | ----------------------------------------------------------------------------------------- |
| `./base`   | All projects   | `no-explicit-any` (error), `no-unused-vars` (ignore `_` prefix), `prefer-const`, `eqeqeq` |
| `./nestjs` | Ingestion API  | Extends base. Allows console, empty constructors (DI pattern).                            |
| `./nextjs` | Live Dashboard | Extends base. Browser globals, React JSX transform rules.                                 |
| `./node`   | Stream API     | Extends base. `require-await`, `no-floating-promises` (error).                            |

## Usage

```javascript
// eslint.config.js
import nestjsConfig from '@distributed-systems-lab/eslint-config/nestjs';

export default [...nestjsConfig];
```

## Peer Dependencies

- `eslint` >= 9.0.0
- `typescript` >= 5.0.0
