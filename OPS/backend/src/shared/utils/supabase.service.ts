import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('supabase.url');
    const key = this.configService.get<string>('supabase.serviceRoleKey');
    this.client = createClient(url, key);
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  async verifyToken(token: string) {
    const { data, error } = await this.client.auth.getUser(token);
    if (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    return data.user;
  }
}
