import { Injectable } from '@nestjs/common';

@Injectable()
export class ProcurementService {
  async findAll() {
    return { message: 'Procurement module - Phase 0 placeholder' };
  }
}
