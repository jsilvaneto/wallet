import { UsersService } from '../../application/users/users.service';
import { CreateUserDto } from '../../application/users/dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<any>;
}
