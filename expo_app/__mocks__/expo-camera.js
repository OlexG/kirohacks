const grantedPermission = {
  canAskAgain: true,
  expires: "never",
  granted: true,
  status: "granted",
};

module.exports = {
  CameraView: "CameraView",
  useCameraPermissions: () => [
    grantedPermission,
    async () => grantedPermission,
    async () => grantedPermission,
  ],
};
