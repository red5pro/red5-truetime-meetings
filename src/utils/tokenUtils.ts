import { getUrlParameter } from './utils.tsx';
import { isNull } from 'lodash';

// Types

export const getToken = (): string => {
  let token = getUrlParameter('token');
  if (isNull(token)) {
    token = '';
  }
  return token as string;
};
