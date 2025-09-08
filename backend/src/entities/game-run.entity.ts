import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PlayerEntity } from './player.entity';

@Entity('game_runs')
export class GameRunEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  playerId: string;

  @Column({ default: 1 })
  currentStage: number;

  @Column('jsonb', { nullable: true })
  team: any; // MonsterInstance[]

  @Column('jsonb', { default: '[]' })
  inventory: any; // Item[]

  @Column({ default: 100 })
  currency: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  endedAt: Date;

  @Column('simple-array', { nullable: true })
  permanentItems: string[];

  @Column('jsonb', { nullable: true })
  temporaryEffects: any;

  @ManyToOne(() => PlayerEntity, player => player.gameRuns)
  @JoinColumn({ name: 'playerId' })
  player: PlayerEntity;
}
