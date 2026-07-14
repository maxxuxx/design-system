import packageManifest from '../../package.json';
import brand from './brand.json';

export const BRAND = Object.freeze({
  ...brand,
  version: packageManifest.version,
});
