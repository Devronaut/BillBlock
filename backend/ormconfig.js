module.exports = {
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",    // e.g., "postgres"
  password: "$DATA-theking",    // the password you set during installation
  database: "Billblock",
  synchronize: true,
  logging: false,
  entities: ["src/models/**/*.ts"],
};
