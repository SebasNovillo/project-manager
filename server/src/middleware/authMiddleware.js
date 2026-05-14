import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma.js';

export async function authenticate(request, response, next) {
  const header = request.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return response.status(401).json({
      message: 'Authentication required'
    });
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId
      }
    });

    if (!user) {
      return response.status(401).json({
        message: 'User not found'
      });
    }

    request.user = user;
    next();
  } catch (error) {
    return response.status(401).json({
      message: 'Invalid token'
    });
  }
}

