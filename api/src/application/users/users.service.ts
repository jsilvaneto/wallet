import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(createUserDto.password, salt);

        return this.prisma.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password_hash,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                created_at: true,
            },
        });
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
}
