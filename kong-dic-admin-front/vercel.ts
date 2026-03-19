import { routes, deploymentEnv, type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/api/admin/:path*', `${deploymentEnv('REACT_APP_ADMIN_API_BASE_URL')}/:path*`),
    routes.rewrite('/api/main/:path*', `${deploymentEnv('REACT_APP_API_BASE_URL')}/:path*`),
    routes.rewrite('/(.*)', '/index.html'),
  ],
};