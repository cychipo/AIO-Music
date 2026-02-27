import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../common/schemas/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existing = await this.userModel.findOne({ email: registerDto.email });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
    });

    const token = this.generateToken(user);
    return { user, token };
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const token = this.generateToken(user);
    return { user, token };
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  private generateToken(user: UserDocument) {
    return this.jwtService.sign({
      sub: user._id,
      email: user.email,
    });
  }

  async validateById(userId: string): Promise<UserDocument> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.isActive) throw new UnauthorizedException();
    return user;
  }
}
