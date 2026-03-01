import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        created_at: Date;
        name: string;
        email: string;
        role: import(".prisma/client").$Enums.Role;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        email: string;
        password_hash: string;
        role: import(".prisma/client").$Enums.Role;
        updated_at: Date;
        deleted_at: Date | null;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        created_at: Date;
        name: string;
        email: string;
        password_hash: string;
        role: import(".prisma/client").$Enums.Role;
        updated_at: Date;
        deleted_at: Date | null;
    } | null>;
}
