# Jarvis
---

## Prerequisites

- Ensure you have `git` installed on your system.
- Ensure you have `docker` and `docker-compose` installed.

## Cloning the Repositories

- Clone the `Jarvis` repository:
    ```sh
    git clone https://github.com/Shaharyar-developer/Jarvis
    ```

## Setting Up the Server

1. Navigate to the `Jarvis` directory:
    ```sh
    cd Jarvis
    ```

2. Rename the file `.env.example` to `.env`:
    ```sh
    mv .env.example .env
    ```

3. Open the `.env` file in your preferred text editor and add your OpenAI API key:
    ```sh
    OPENAI_API_KEY=your_openai_api_key_here
    ```

4. Run the server using Docker Compose:
    ```sh
    sudo docker compose up
    ```
