import { loginAdmin, getAdminById } from '../services/auth.service.js';
import { adminLoginSchema } from '../validators/index.js';

export async function login(req, res, next) {
  try {
    const { email, password } = adminLoginSchema.parse(req.body);
    const result = await loginAdmin(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
}

export async function logout(req, res) {
  // Stateless JWT logout (client discards token)
  res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export async function me(req, res, next) {
  try {
    const admin = await getAdminById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ success: false, error: 'Admin not found' });
    }
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
}
