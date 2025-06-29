# CTF Challenges Docker Setup

This directory contains a Docker Compose configuration with Traefik reverse proxy to run multiple CTF challenges simultaneously.

## Setup

1. **Start the services:**

   ```bash
   docker compose up --build
   ```

2. **Access the challenges:**
   - Cookie Spoofing 1: http://cookie1.localhost
   - Cookie Spoofing 2: http://cookie2.localhost
   - Traefik Dashboard: http://localhost:8081

## How it works

- **Traefik** acts as a reverse proxy, routing requests based on the `Host` header
- All services run on an internal Docker network (`ctf-network`)
- Only Traefik exposes ports to your host machine (port 80 and 8081)
- Each challenge is accessible via its own subdomain

## Adding new challenges

To add a new challenge:

1. Add a new service to `docker-compose.yml`
2. Configure Traefik labels for routing:
   ```yaml
   labels:
     - "traefik.enable=true"
     - "traefik.http.routers.yourchallenge.rule=Host(`yourchallenge.localhost`)"
     - "traefik.http.routers.yourchallenge.entrypoints=web"
     - "traefik.http.services.yourchallenge.loadbalancer.server.port=3000"
   ```

## Stopping services

```bash
docker compose down
```

## Notes

- The `.localhost` domains work automatically on most systems
- If you need custom domains, add them to your `/etc/hosts` file
- Traefik dashboard shows all registered services and their health status
