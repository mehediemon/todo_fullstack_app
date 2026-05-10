# Todo Fullstack App - DockerHub + Private k3s Deployment

This repository contains a React/Vite frontend, FastAPI backend, PostgreSQL, GitHub Actions Docker builds, and Kubernetes/Helm deployment files for a private k3s cluster.

## Your deployment settings

- DockerHub user: `mehedib127`
- Backend image: `mehedib127/todo-backend:latest`
- Frontend image: `mehedib127/todo-frontend:latest`
- k3s control-plane node: `192.168.68.106`
- k3s worker node: `192.168.68.116`
- Frontend exposed through Traefik ingress on `http://192.168.68.106`
- Backend service remains private as `ClusterIP`

## Important application routing

The frontend must call the API using a relative URL:

```js
fetch("/api/...")
```

The frontend Nginx config proxies `/api/` to the internal backend service:

```text
http://todo-backend:8000/
```

So the backend is not exposed directly outside the cluster.

## GitHub Actions secrets

In GitHub repository settings, add:

| Secret | Value |
|---|---|
| `DOCKERHUB_USERNAME` | `mehedib127` |
| `DOCKERHUB_TOKEN` | DockerHub access token |

On push to `main`, GitHub Actions builds and pushes:

- `mehedib127/todo-frontend:latest`
- `mehedib127/todo-frontend:<git-sha>`
- `mehedib127/todo-backend:latest`
- `mehedib127/todo-backend:<git-sha>`

## Deploy with Helm

From your laptop, make sure your kubeconfig points to your k3s API server:

```yaml
server: https://192.168.68.106:6443
```

Then run:

```bash
cd helm/todo-app

helm upgrade --install todo . \
  --namespace todo-app \
  --create-namespace
```

Open:

```text
http://192.168.68.106
```

## Deploy with plain manifests

Alternative:

```bash
kubectl apply -f manifests/all.yaml
```

## Verify

```bash
kubectl get pods -n todo-app
kubectl get svc -n todo-app
kubectl get ingress -n todo-app
kubectl get hpa -n todo-app
```

## HPA / metrics-server

HPA requires metrics-server.

Check:

```bash
kubectl top nodes
```

If it fails, install metrics-server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

For k3s, if metrics still fails, patch metrics-server args:

```bash
kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

## Update after new image push

Because the chart uses the `latest` tag, restart workloads after GitHub Actions pushes new images:

```bash
kubectl rollout restart deployment todo-frontend -n todo-app
kubectl rollout restart deployment todo-backend -n todo-app
```

Better production practice: deploy the immutable Git SHA tag instead of `latest`.
