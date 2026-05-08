# PYQ Archive

This is a student contributed and maintained repository of GEHU question papers.

## Contribute Pyqs

See [contribution guide](https://gehuhaldwani.github.io/pyqs/contribute/)

## Credits

<https://gehuhaldwani.github.io/pyqs/about/>

---

# Local Development

## Requirements

Bun.js or Node.js >= v24.XX

## Steps

0. Clone `gh-pages` branch

  ```sh
  git clone --branch gh-pages --single-branch https://github.com/gehuhaldwani/pyqs.git pyqs-web
  ```
0. Clone `main` branch

  ```sh
  git clone --branch main --single-branch https://github.com/gehuhaldwani/pyqs.git pyqs-web/pyqs
  ```

0. Change directory

  ```sh
  cd pyqs-web
  ```

0. Install dependencies

  ```sh
  bun i
  ```

0. Run

  ```sh
  bun --bun dev
  ```

0. Build

  ```sh
  bun --bun run build
  ```
