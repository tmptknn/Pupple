uniform float iTime;
uniform float uFov;
uniform vec3 uFront;
uniform vec3 uUp;
uniform vec3 uLeft;
uniform vec3 uPos;
uniform vec2 iResolution;
//uniform vec2 uAngle;
uniform sampler2D tDiffuse;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;

varying vec2 vUv;


#define PI 			3.14159265359
#define FOV 		50.0


// borrowed IQs hash
  const uint k = 1103515245U;  // GLIB C
//const uint k = 134775813U;   // Delphi and Turbo Pascal
//const uint k = 20170906U;    // Today's date (use three days ago's dateif you want a prime)
//const uint k = 1664525U;     // Numerical Recipes

vec3 hash33( uvec3 x )
{
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    
    return vec3(x)*(1.0/float(0xffffffffU));
}

float sdPlane( vec3 p, vec3 n, float h )
{
  // n must be normalized
  return dot(p,n) + h;
}
float s_rain = 24.;

float flexTime(){
    return 4.0*(iTime+2.0*sin(iTime*.5));
}

vec4 getDrop(in vec3 p){
    vec3 s = vec3(s_rain);
    
    //vec3 rainFactor =vec3(0,flexTime()*s.x,0);
    vec3 rainFactor =vec3(0,10,0);
    vec3 pp = p+rainFactor;
    vec3 cell0 = s*round(pp/s);
    vec3 h =hash33(uvec3(-(-cell0.xyz*10000.-1000000.)));
    float dropSize =(hash33(uvec3(-(-cell0.zxy*10000.-10000000.)))).z*8.;
    return vec4(pp- cell0+((h.xyz-0.5)*(s-dropSize*3.0)),dropSize);
}
/*
float waves(in vec3 p){
    float sum =0.;
    for(int i=0; i<2; i++){
        vec3 h2 = hash33(uvec3(7+i));
        vec3 pp= p*2.0;
        float t = flexTime()*3.;
        vec3 h = hash33(uvec3(3+i))*0.5+0.5;
        float a = h2.x*PI*2.;
        sum += sin((h.z+t+pp.x)*h2.y*sin(a)+(pp.z+h.x+t)*cos(a)*h2.y+t*h.y);
    }
    return sum;
}

float calculateDropWaves(in vec3 p){
    float sum = 0.;
    for(int i=-1; i<2;i++){
        for(int j=-1; j<2; j++){
            for(int k=-1; k<1; k++){     
                vec4 drop =getDrop(p+vec3(i,k,j)*vec3(s_rain));
                drop.xyz-=vec3(i,k,j)*vec3(s_rain);
                if(drop.y > 0.0){
                    float rippleSize =s_rain;
                    float dist =max(drop.y-length(drop.xz),0.0);
                    float size =min(dist, rippleSize)/rippleSize;
                    float factor = min(max(0.,(rippleSize-drop.y))/rippleSize,1.);
                    sum+=factor*factor*(size*size)*0.5*sin(5.0*dist);
                }
            }
        }
    }
    return sum+waves(p)*0.01;
}
*/

float rain( vec3 p){
    vec4 drop = getDrop(p);
    return max(-(length(drop.xyz)-(drop.w-0.00001)),length(drop.xyz)-(drop.w));
    //return length(drop.xyz)-(drop.w);

}
vec2 worldToSpherical(in vec3 flatCoord)
{
    flatCoord *= -1.;
	//flatCoord.y *=  -1.;
    vec3 n = normalize(flatCoord);
 
    float len = sqrt (n.x *n.x + n.y*n.y);
 
    float s = acos( n.x / len);
    if (n.y < 0.) {
        s = 2.0 * PI - s;
    }
 
    s = s / (2.0 * PI);
    return vec2(s , ((asin(n.z) * -2.0 / PI ) + 1.0) * 0.5);
}

vec4 skyColor(in vec3 ro, in vec3 rd){
    return texture2D(iChannel0, worldToSpherical(normalize(rd.xzy)));
}

vec4 bubbleColor(in vec3 ro, in vec3 rd){
    return texture2D(iChannel1, flexTime()*0.001+0.002*(rd.zx+rd.yz+rd.yx));
}

float water_level = 1.0;

vec2 map_the_world(in vec3 p)
{
    //float water_0 = p.y>0.5?1e20:sdPlane(p, vec3(0,1,0), water_level)+2.5*calculateDropWaves(p);
    //float rain_0 = rain(p);
    //return (rain_0<water_0)?vec2(2,rain_0):vec2(1,water_0);
    return vec2(2,rain(p));
}


vec3 calculate_normal(in vec3 p, in bool ignore_water)
{
    const vec3 small_step = vec3(0.001, 0.0, 0.0);
    float gradient_x = map_the_world(p + small_step.xyy).y - map_the_world(p - small_step.xyy).y;
    float gradient_y = map_the_world(p + small_step.yxy).y - map_the_world(p - small_step.yxy).y;
    float gradient_z = map_the_world(p + small_step.yyx).y - map_the_world(p - small_step.yyx).y;
    vec3 normal = vec3(gradient_x, gradient_y, gradient_z);
    return normalize(normal);
}


vec4 ray_march(in vec3 ro, in vec3 rd, in bool ignore_water)
{
    float total_distance_traveled = 0.0;
    const int NUMBER_OF_STEPS = 128;
    const float MINIMUM_HIT_DISTANCE = 0.001;
    const float MAXIMUM_TRACE_DISTANCE = 10.0;
    float watereffect = ignore_water?0.25:0.;
    vec3 ro_reflected = vec3(0);
    float total_distance_traveled_reflected = 0.0;
    vec3 rd_reflected = vec3(0);
    float reflection_multiplier = 0.0;
    for (int i = 0; i < NUMBER_OF_STEPS; ++i)
    {
        vec3 current_position = ro + total_distance_traveled * rd;
        vec2 distance_to_closest = map_the_world(current_position);
        vec3 current_position_reflected = vec3(0);
        vec2 distance_to_closest_reflected = vec2(0);
        if(ro_reflected != vec3(0)){
            current_position_reflected = ro_reflected + total_distance_traveled_reflected * rd_reflected;
            distance_to_closest_reflected = map_the_world(current_position_reflected);
            if (distance_to_closest.y < MINIMUM_HIT_DISTANCE ) 
            {
                vec3 normal = calculate_normal(current_position_reflected, ignore_water);
                vec3 light_position = vec3(0,1,0);
                if(distance_to_closest_reflected.x==2.0 && !ignore_water){ // refract from rain drops
                    ro_reflected=ro_reflected+rd_reflected*total_distance_traveled_reflected;
                    rd_reflected = (1./1.4)*(cross(normal,cross(-normal,rd_reflected))-normal*sqrt(1.-pow(1./1.4,2.0)*dot(cross(normal,rd),cross(normal,rd))));
                }
                
            }
        }
        
        if (distance_to_closest.y < MINIMUM_HIT_DISTANCE ) 
        {
            vec3 normal = calculate_normal(current_position, ignore_water);
            vec3 light_position = vec3(0,1,0);
            if(distance_to_closest.x==2.0 && !ignore_water){   // reflect from surface of water
                rd_reflected =normalize(reflect(rd, normal));
                ro_reflected = ro+rd*distance_to_closest.y;
                float ref = abs(dot(normalize(rd),cross(light_position,normal)));
                reflection_multiplier = (reflection_multiplier==0.0)?ref:ref*ref;
                
            }
            if(distance_to_closest.x==2.0 && !ignore_water){ // refract from rain drops
                ro=ro+rd*total_distance_traveled;
                rd = (1./1.4)*(cross(normal,cross(-normal,rd))-normal*sqrt(1.-pow(1./1.4,2.0)*dot(cross(normal,rd),cross(normal,rd))));
            }
        }

        if ((total_distance_traveled > MAXIMUM_TRACE_DISTANCE ||
            current_position.z>30.0 ||
            current_position.z<-30.0 ||
            current_position.x>30.0 ||
            current_position.x<-30.0)&&(total_distance_traveled_reflected > MAXIMUM_TRACE_DISTANCE ||
            current_position.z>30.0 ||
            current_position.z<-30.0 ||
            current_position.x>30.0 ||
            current_position.x<-30.0))
            {
                break;
            }
        total_distance_traveled += distance_to_closest.y/4.;
        total_distance_traveled_reflected += distance_to_closest_reflected.y/4.;
    }
    
    return mix((1.0-reflection_multiplier)*vec4(skyColor(ro,rd).xyz,1.0)+reflection_multiplier*2.*bubbleColor(ro_reflected,rd_reflected)*((ro_reflected!=vec3(0))?vec4(skyColor(ro_reflected,rd_reflected).xyz,0.0):vec4(0)),vec4(0.0,0.0,0.1,1.0),watereffect);
}

vec4 samplePixel(in vec2 fragCoord){
    vec2 uv = ((2.0*fragCoord.xy)/iResolution.yx) * tan (radians(uFov/2.));
	vec3 up = normalize(uUp);//vec3 (0.0, 1.0, 0.0);			// up 
    vec3 fw = normalize(uFront);//vec3 (sin(a), 0.0, -cos(a));			// forward
	vec3 lf = normalize(uLeft);//cross (up, fw); 					// left
	
	vec3 ro =  uPos; // ray origin
	vec3 rd = normalize ((uv.x) * lf + (uv.y) * up + fw) ; 		// ray direction
    
    vec4 march = ray_march(ro,rd, false);
    //if(march.w<0.){
    //    march = ray_march(ro+normalize(rd)*-march.w,march.xyz, true);
    //}
    
    return (march.w<30.)?vec4(march.xyz,1.0):skyColor(ro,rd);
}

vec4 superSamplePixel(in vec2 fragCoord){
    vec2 step = vec2(.5);
    vec4 sum=vec4(0);
    for(int i=0;i<2;i++){
        for(int j=0; j<2;j++){
            sum+=samplePixel(fragCoord+vec2(i,j)*step);
        }
    }
    return sum/4.0;
}

void main() {
    vec2 fragCoord = -1.0 + 2.0 *vUv;
    gl_FragColor = samplePixel(fragCoord);//+0.3*texture2D(tDiffuse, vUv);
}