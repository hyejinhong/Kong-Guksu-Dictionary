import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/api/:path*', `${deploymentEnv('REACT_APP_API_BASE_URL')}/:path*`)
  ],
};