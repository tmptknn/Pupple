import { Vector2, Vector3 } from "three";

function doesSphereCollideWithTorus(
  spherePosition,
  sphereRadius,
  torusRadius,
  torusInversionMatrix
) {
  let invertedSpherePosition = spherePosition
    .clone()
    .applyMatrix4(torusInversionMatrix);
  let q = new Vector2(
    new Vector2(invertedSpherePosition.x, invertedSpherePosition.y).length() -
      torusRadius.x,
    invertedSpherePosition.z
  );
  return q.length() - torusRadius.y <= sphereRadius;
}

function collideSpheresWithToruses(spheres, toruses) {
  let collisions = [];
  for (let i = 0; i < spheres.length; i++) {
    for (let j = 0; j < toruses.length; j++) {
      if (
        doesSphereCollideWithTorus(
          spheres[i].position,
          spheres[i].geometry.parameters.radius,
          new Vector2(0.5, 0.005),
          toruses[j].matrixWorld.invert()
        )
      ) {
        collisions.push({ sphere: i, torus: j });
      }
    }
  }
  return collisions;
}

export { collideSpheresWithToruses };
