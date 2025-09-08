import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { GameRunEntity } from './game-run.entity';

@Entity('players')
export class PlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ default: 100 })
  permanentCurrency: number;

  @Column('simple-array', { default: '' })
  unlockedStarters: string[];

  @Column('simple-array', { default: '' })
  unlockedAbilities: string[];

  @Column({ default: 0 })
  totalRuns: number;

  @Column({ default: 0 })
  bestStage: number;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GameRunEntity, gameRun => gameRun.player)
  gameRuns: GameRunEntity[];
}
