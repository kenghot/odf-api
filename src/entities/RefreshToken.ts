import { Entity, PrimaryColumn } from "typeorm";

@Entity("refresh_token")
export class RefreshToken {
  @PrimaryColumn()
  refreshToken: string;

  @PrimaryColumn({ length: 16 })
  uid: string;

  @PrimaryColumn({ length: 64 })
  clientId: string;
}
