/**
 * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
 * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
 */
const dbPassword = "MyPassword";
const dbName = "MyCluster";
const dbUser = "MyUser";
const uri = `mongodb+srv://${dbUser}:${dbPassword}@${dbName}.z40bi.mongodb.net/${dbName}?retryWrites=true&w=majority`;

module.exports = {uri};