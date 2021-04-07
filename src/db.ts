import { createConnection } from "typeorm";

export const initDB = async () => {
  try {
    // const connectionOptions = await getConnectionOptions();

    const con = await createConnection();
    return con;
  } catch (err) {
    throw err;
  }
};
