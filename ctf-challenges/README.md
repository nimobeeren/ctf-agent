# CTF Challenges

This directory contains a collection of Capture The Flag (CTF) challenges for cybersecurity practice and learning as well as testing the CTF agent.

## Challenge Structure

Each subdirectory contains a different challenge with the following files:

- `challenge.md` - Challenge description and objectives
- `solution.md` - Step-by-step solution guide (spoiler alert!)
- Additional files needed to run the challenge locally

## Running Challenges

### Run All Challenges

To start all challenges at once:

```bash
docker compose up
```

Access the challenges at:

http://<challenge-name>.127.0.0.1.nip.io

### Run Individual Challenges

To run just one challenge, navigate to its directory and start it:

```bash
cd cookie1
docker build -t cookie1 .
docker run -p 3000:3000 cookie1
```

Then access it at http://localhost:3000

## How It Works

To run multiple challenges simultaneously, we use **Traefik** as a reverse proxy, which routes requests based on the `Host` header. All services run on an internal Docker network, with only Traefik exposing ports to your host machine. This allows each challenge to be accessible via its own subdomain. Because not all clients resolve the IP address for `localhost` subdomains correctly, we use `nip.io`, a DNS server that routes back to `127.0.0.1`.

## Stopping Services

```bash
docker compose down
```

## Adding New Challenges

To add a new challenge:

1. Create a new directory with your challenge files
2. Add a `Dockerfile` to containerize your challenge
3. Add a new service to `docker-compose.yml` with appropriate Traefik labels
4. Include `challenge.md` and `solution.md` files
