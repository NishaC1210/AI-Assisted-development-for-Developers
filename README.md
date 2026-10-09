# AI-Assisted Development for Developers

Companion code for *AI-Assisted Development for Developers*, published by Packt.

The book builds two projects with an AI coding assistant, and this repository holds the code for both. Each project lives on its own branch, and its commit history follows the book: every commit is the state of the code at a point in the text, so you can step through the project chapter by chapter instead of only seeing the finished result.

**The `main` branch contains no project code.** Switch to one of the branches below.

## What's in the repository

| Branch | Chapters | Project |
| --- | --- | --- |
| `project-1` | 4 to 8 | **Dashboard application.** A full-stack app with user registration, JWT login, a protected dashboard and notes. Node.js and Express backend, React frontend, PostgreSQL running in Docker. |
| `project-2` | 9 to 12 | **Trip Planner Assistant.** A chatbot web app that uses Anthropic's Claude API, with tool calling (time, destination guides, travel advisories), parallel tool calls, timeouts and retries, prompt-injection guardrails, and Heroku deployment. Node.js and Express backend, Vite and React frontend. |

The two projects are independent of each other. Each branch has its own `README.md` with setup and run instructions.

## Getting the code

Clone the repository once, then switch to the project you're working on:

```bash
git clone https://github.com/NishaC1210/AI-Assisted-development-for-Developers.git
cd AI-Assisted-development-for-Developers

git switch project-1     # Chapters 4 to 8
# or
git switch project-2     # Chapters 9 to 12
```

## Following along chapter by chapter

Because each commit matches a step in the book, the commit log doubles as a table of contents for the project. To see it, run this on either branch:

```bash
git log --oneline --reverse
```

The commits are listed oldest first, in the order they appear in the book.

To see the code exactly as it stood at any step, check out that commit by its hash (the short code at the start of each line in the log):

```bash
git checkout <commit-hash>
```

Project 1 also has tags you can check out by name:

```bash
git checkout Version1
git checkout Version2
git checkout Version3
git checkout Version4
```

To see exactly what changed in a single step, which is often the most useful way to compare your own work with the book's:

```bash
git show <commit-hash>
```

When you're done looking at an earlier step, return to the finished project with `git switch project-1` or `git switch project-2`.

### A note on "detached HEAD"

Checking out a commit hash or a tag puts Git in what it calls a *detached HEAD* state. That's expected and harmless; you're simply viewing an older snapshot. If you want to make your own changes starting from that point, create a branch first so your work isn't lost:

```bash
git switch -c my-chapter-6-work
```

## Requirements

Both projects need [Node.js](https://nodejs.org/) (v18 or later recommended) and npm.

- **Project 1** also needs [Docker Desktop](https://www.docker.com/products/docker-desktop/) to run PostgreSQL.
- **Project 2** needs an Anthropic API key. Copy `server/.env.example` to `server/.env` and add your key there. Never commit your `.env` file.

See the README on each branch for the full setup steps.

## License

This code is released under the MIT License. See [LICENSE](LICENSE).
