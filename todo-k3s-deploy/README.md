# Todo app deployment for private k3s

This package contains:

- `helm/todo-app`: Helm chart for namespace, ConfigMap, Secret, deployments, services, ingress, PVC, and HPA.
- `manifests/all.yaml`: Plain Kubernetes manifests with the same defaults.

## Architecture

- Frontend: 2 replicas, ClusterIP service, exposed through Traefik Ingress.
- Backend: 2 replicas, internal ClusterIP only.
- Browser calls `/api/...` on the frontend host. Frontend Nginx proxies `/api/` to `todo-backend:8000` inside the cluster, stripping `/api`.
- PostgreSQL: internal ClusterIP with PVC.
- HPA: backend scales from 2 to 5 replicas at 70% CPU utilization.

## Build and push images

From the extracted app root:

```bash
# Backend
docker build -t ghcr.io/YOUR_ORG/todo-backend:1.0.0 ./backend
docker push ghcr.io/YOUR_ORG/todo-backend:1.0.0

# Frontend: build with same-origin API URL
docker build --build-arg VITE_API_URL=/api -t ghcr.io/YOUR_ORG/todo-frontend:1.0.0 ./frontend
docker push ghcr.io/YOUR_ORG/todo-frontend:1.0.0
```

For a fully private cluster, push to a registry reachable by your nodes, such as an internal registry or local registry mirror, and change the image names in `values.yaml` or `manifests/all.yaml`.

## Deploy with Helm

```bash
helm upgrade --install todo ./helm/todo-app \
  --namespace todo-app --create-namespace \
  --set ingress.host=todo.example.local \
  --set frontend.image=ghcr.io/YOUR_ORG/todo-frontend:1.0.0 \
  --set backend.image=ghcr.io/YOUR_ORG/todo-backend:1.0.0 \
  --set postgres.password='REPLACE_ME' \
  --set appSecret.secretKey='REPLACE_WITH_LONG_RANDOM_SECRET'
```

## Deploy with kubectl

Edit image names, host, and secrets in `manifests/all.yaml`, then:

```bash
kubectl apply -f manifests/all.yaml
```

## Ingress on your private k3s cluster

Your nodes have only private IPs, which is good. k3s normally installs Traefik. Keep services as ClusterIP and use the Traefik ingress entrypoint on the node private IP.

For LAN/private access, add DNS or a hosts entry pointing your host to a node IP:

```text
192.168.68.106 todo.example.local
```

Then open:

```text
http://todo.example.local
```

If you need internet access while keeping nodes private, do not add node public IPs. Use one of these patterns:

- Cloudflare Tunnel / Tailscale Funnel / reverse tunnel to Traefik.
- VPN such as Tailscale/WireGuard and private DNS.
- An external reverse proxy with a private route to the cluster network.

## Metrics Server for HPA

HPA needs resource metrics. Check:

```bash
kubectl top nodes
kubectl top pods -n todo-app
```

If those commands fail, install metrics-server for k3s before expecting HPA to work.
