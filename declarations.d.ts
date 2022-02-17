import { AxiosRequestConfig } from "axios";

declare module "axios" {
  interface AxiosRequestConfig extends AxiosRequestConfig {
    version?: string;
  }
}
