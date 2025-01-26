import { Vector2, Vector3 } from "three";
import { Matrix3 } from "three/webgpu";

function doesSphereCollideWithTorus(
  spherePosition,
  sphereRadius,
  torusRadius,
  torusInversionMatrix
) {
  //new Vector3().;
  let inversion = new Matrix3().setFromMatrix4(torusInversionMatrix);
  let invertedSpherePosition = spherePosition.clone().applyMatrix3(inversion);
  let q = new Vector2(
    new Vector2(invertedSpherePosition.x, invertedSpherePosition.y).length() -
      torusRadius.x,
    invertedSpherePosition.z
  );
  return q.length() - torusRadius.y <= sphereRadius;
}

function doesSphereCollideWithSphere(sphere1, sphere2) {
  return (
    sphere1.position.distanceTo(sphere2.position) <=
    sphere1.geometry.parameters.radius + sphere2.geometry.parameters.radius
  );
}

/*

float sdCone( vec3 p, vec2 c, float h )
{
  // c is the sin/cos of the angle, h is height
  // Alternatively pass q instead of (c,h),
  // which is the point at the base in 2D
  vec2 q = h*vec2(c.x/c.y,-1.0);
    
  vec2 w = vec2( length(p.xz), p.y );
  vec2 a = w - q*clamp( dot(w,q)/dot(q,q), 0.0, 1.0 );
  vec2 b = w - q*vec2( clamp( w.x/q.x, 0.0, 1.0 ), 1.0 );
  float k = sign( q.y );
  float d = min(dot( a, a ),dot(b, b));
  float s = max( k*(w.x*q.y-w.y*q.x),k*(w.y-q.y)  );
  return sqrt(d)*sign(s);
}
*/
function doesConeCollideWithSphere(
  sphere,
  cone /*
  coneAngle,
  coneHeight,*/,
  invertedConeMatrix
) {
  let inversion = new Matrix3().setFromMatrix4(invertedConeMatrix);
  let invertedSpherePosition = sphere.position.clone().applyMatrix3(inversion);
  let q = cone; //new Vector2((coneHeight * coneAngle.x) / coneAngle.y, -coneHeight);
  let w = new Vector2(
    new Vector2(invertedSpherePosition.x, invertedSpherePosition.y).length(),
    invertedSpherePosition.z
  );
  let a = w.sub(
    q.multiplyScalar(Math.min(Math.max(w.dot(q) / q.dot(q), 0.0), 1.0))
  );
  let b = w.sub(
    q.multiply(new Vector2(Math.min(Math.max(w.x / q.x, 0.0), 1.0), 1.0))
  );
  let k = Math.sign(q.y);
  let d = Math.min(a.dot(a), b.dot(b));
  let s = Math.max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return Math.sqrt(d) * Math.sign(s) <= sphere.geometry.parameters.radius;
}

function collideSpheresWithToruses(spheres, toruses) {
  let collisions = [];
  for (let i = 0; i < spheres.length; i++) {
    for (let j = 0; j < toruses.length; j++) {
      if (
        doesSphereCollideWithTorus(
          spheres[i].position,
          spheres[i].geometry.parameters.radius,
          new Vector2(0.5, 0.05),
          toruses[j].matrixWorld.invert()
        )
      ) {
        collisions.push({ sphere: i, torus: j });
      }
    }
  }
  return collisions;
}

function collideSpheresWithSpheres(spheres) {
  let collisions = [];
  for (let i = 0; i < spheres.length; i++) {
    for (let j = i + 1; j < spheres.length; j++) {
      if (doesSphereCollideWithSphere(spheres[i], spheres[j])) {
        collisions.push({ sphere1: i, sphere2: j });
      }
    }
  }
  return collisions;
}

function collideSpheresWithCones(spheres, cones) {
  let collisions = [];
  let angle = Math.PI / 8;
  for (let i = 0; i < spheres.length; i++) {
    for (let j = 0; j < cones.length; j++) {
      if (
        doesConeCollideWithSphere(
          spheres[i],
          new Vector3(0.5, 0, 2),
          cones[j].matrixWorld.invert()
        )
      ) {
        collisions.push({ sphere: i, cone: j });
      }
    }
  }
  return collisions;
}

export {
  collideSpheresWithToruses,
  collideSpheresWithSpheres,
  collideSpheresWithCones,
};
