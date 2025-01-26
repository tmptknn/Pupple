import { Vector2, Vector3 } from "three";
import { Matrix3 } from "three/webgpu";

function closestPointOnSegment(p, a, b) {
  let v = b.sub(a);
  let u = a.sub(p);
  let vu = v.x * u.x + v.y * u.y + v.z * u.z;
  let vv = v.x * v.x + v.y * v.y + v.z * v.z;
  let t = -vu / vv;
  if (t >= 0 && t <= 1) {
    return t;
  }
  let aa = u.x * u.x + u.y * u.y + u.x * u.x;
  let bb =
    (b.x - p.x) * (b.x - p.x) +
    (b.y - p.y) * (b.y - p.y) +
    (b.z - p.z) * (b.z - p.z);
  if (aa < bb) {
    return 0;
  }
  return 1;
}

function doesSphereCollideWithCylinder(sphere, a, b, radius) {
  let t = closestPointOnSegment(sphere.position, a, b);
  let point = a.add(b.sub(a).multiplyScalar(t));
  let distance = point.distanceTo(sphere.position);
  return distance <= radius + sphere.geometry.parameters.radius;
}

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
          new Vector3(0.5, 0, 1),
          cones[j].matrixWorld.invert()
        )
      ) {
        collisions.push({ sphere: i, cone: j });
      }
    }
  }
  return collisions;
}

function collideSpheresWithConesNew(spheres, cones) {
  let collisions = [];
  for (let i = 0; i < spheres.length; i++) {
    for (let j = 0; j < cones.length; j++) {
      let pointa = cones[j].position
        .clone()
        .add(new Vector3(0, 0, 0.25).applyQuaternion(cones[j].quaternion));
      let pointb = cones[j].position
        .clone()
        .add(new Vector3(0, 0, 1.25).applyQuaternion(cones[j].quaternion));
      if (doesSphereCollideWithCylinder(spheres[i], pointa, pointb, 0.5)) {
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
