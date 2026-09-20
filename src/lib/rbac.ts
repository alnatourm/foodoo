import { ActiveModule } from '../components/Navbar';

export const getRoleDefaultModule = (role?: string): ActiveModule => {
  switch (role) {
    case 'CASHIER':
      return 'POS';
    case 'WAITER':
      return 'WAITER';
    case 'KITCHEN':
      return 'KDS';
    case 'ACCOUNTANT':
      return 'ACCOUNTING';
    case 'OWNER':
    case 'SUPER_ADMIN':
    case 'MANAGER':
    default:
      return 'SETUP';
  }
};

export const isModuleAllowedForRole = (module: ActiveModule, role?: string): boolean => {
  const r = role || 'OWNER';
  if (r === 'OWNER' || r === 'SUPER_ADMIN' || r === 'MANAGER') {
    return true;
  }
  if (r === 'WAITER') {
    return module === 'WAITER' || module === 'FLOOR' || module === 'QR_ORDER';
  }
  if (r === 'CASHIER') {
    return module === 'POS' || module === 'FLOOR' || module === 'QR_ORDER';
  }
  if (r === 'KITCHEN') {
    return module === 'KDS';
  }
  if (r === 'ACCOUNTANT') {
    return module === 'ACCOUNTING' || module === 'ANALYTICS' || module === 'INVENTORY' || module === 'PURCHASING';
  }
  return true;
};
