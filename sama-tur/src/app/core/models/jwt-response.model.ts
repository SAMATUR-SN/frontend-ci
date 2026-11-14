export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  identifiant: string;
  roles: string[];
}