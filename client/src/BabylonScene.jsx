import React, { useEffect, useRef, useState } from 'react';
import {
    Engine,
    Scene,
    ArcRotateCamera,
    Vector3,
    HemisphericLight,
    SceneLoader,
    ActionManager,
    ExecuteCodeAction,
    MeshBuilder,
    Color3,
    StandardMaterial,
    Axis,
    Space
} from '@babylonjs/core';
import '@babylonjs/loaders'; // Import loaders for additional file formats
import '@babylonjs/inspector'; // Import the inspector for debugging
import { STLFileLoader } from '@babylonjs/loaders/STL';
import Popup from './PopUp'; // Import the Popup component

const BabylonScene = () => {
    const canvasRef = useRef(null);
    const [hoveredAxis, setHoveredAxis] = useState('?');
    const [meshesToRender, setMeshesToRender] = useState([]);
    const [currentMeshIndex, setCurrentMeshIndex] = useState(0);
    const [selectedMesh, setSelectedMesh] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [useRightHandedSystem, setUseRightHandedSystem] = useState(true);
    const [doNotAlterFileCoordinates, setDoNotAlterFileCoordinates] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        const engine = new Engine(canvas, true);
        const scene = new Scene(engine);
        scene.useRightHandedSystem = useRightHandedSystem;

        STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES = doNotAlterFileCoordinates;

        const camera = new ArcRotateCamera('camera1', -Math.PI / 4, Math.PI / 4, 20, new Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);

        camera.inertia = 0.9;
        camera.wheelPrecision = 50;
        camera.minZ = 0.1;
        camera.lowerRadiusLimit = 0.5;
        camera.upperRadiusLimit = 100;

        new HemisphericLight('light1', new Vector3(0, 1, 0), scene);

        createAxisLines(scene);

        scene.debugLayer.show();

        engine.runRenderLoop(() => scene.render());

        window.addEventListener('resize', () => engine.resize());

        canvasRef.current.__scene__ = scene; // Store the scene reference for later use

        return () => engine.dispose();
    }, [useRightHandedSystem, doNotAlterFileCoordinates]);

    const createAxisLines = (scene) => {
        const axisLength = 1000;
        const axisThickness = 20;

        createAxis(scene, new Vector3(1, 0, 0), Color3.Red(), axisLength, axisThickness, 'X+');
        createAxis(scene, new Vector3(-1, 0, 0), Color3.Red(), axisLength, axisThickness, 'X-');
        createAxis(scene, new Vector3(0, 1, 0), Color3.Green(), axisLength, axisThickness, 'Y+');
        createAxis(scene, new Vector3(0, -1, 0), Color3.Green(), axisLength, axisThickness, 'Y-');
        createAxis(scene, new Vector3(0, 0, 1), Color3.Blue(), axisLength, axisThickness, 'Z+');
        createAxis(scene, new Vector3(0, 0, -1), Color3.Blue(), axisLength, axisThickness, 'Z-');
    };

    const createAxis = (scene, direction, color, length, thickness, axisName) => {
        const points = [Vector3.Zero(), direction.scale(length)];
        const axis = MeshBuilder.CreateLines(`${axisName}Axis`, { points }, scene);

        const axisMaterial = new StandardMaterial(`${axisName}Material`, scene);
        axisMaterial.diffuseColor = color;
        axis.material = axisMaterial;

        axis.color = color;

        axis.actionManager = new ActionManager(scene);
        axis.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => setHoveredAxis(axisName)));
        axis.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => setHoveredAxis('?')));
    };

    const handlePopupSubmit = (position, rotation) => {
        if (selectedMesh) {
            selectedMesh.position = new Vector3(position.x, position.y, position.z);
            selectedMesh.rotation = new Vector3(0, 0, 0); // Reset rotation to prevent conflicts
            selectedMesh.rotate(Axis.X, rotation.x, Space.LOCAL);
            selectedMesh.rotate(Axis.Y, rotation.y, Space.LOCAL);
            selectedMesh.rotate(Axis.Z, rotation.z, Space.LOCAL);
        }
        setShowPopup(false);
    };

    const handleFileUpload = async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const scene = canvasRef.current.__scene__; // Access the current scene
            const loadedMeshes = [];

            for (let file of files) {
                try {
                    const result = await SceneLoader.ImportMeshAsync("", "", file, scene);
                    result.meshes.forEach((mesh, index) => {
                        if (file.name.endsWith('.stl')) {
                            mesh.scaling = new Vector3(0.001, 0.001, 0.001);
                        }
                        mesh.name = `${file.name.split('.')[0]}_mesh_${index}`;
                        loadedMeshes.push(mesh);
                        // createPivotPointMarker(mesh, scene);

                        // Allow mesh selection for manipulation
                        mesh.actionManager = new ActionManager(scene);
                        mesh.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
                            setSelectedMesh(mesh);
                            setShowPopup(true);
                        }));
                    });
                } catch (error) {
                    console.error(`Error loading model ${file.name}:`, error);
                }
            }

            setMeshesToRender(loadedMeshes);
            if (loadedMeshes.length > 0) {
                setSelectedMesh(loadedMeshes[0]); // Select the first loaded mesh
                setShowPopup(true);
            }
        }
    };

    // const createPivotPointMarker = (mesh, scene) => {
    //     const pivotMarker = MeshBuilder.CreateSphere(`${mesh.name}_pivotMarker`, { diameter: 10 }, scene);
    //     pivotMarker.position = mesh.getAbsolutePosition();

    //     const pivotMaterial = new StandardMaterial(`${mesh.name}_pivotMaterial`, scene);
    //     pivotMaterial.diffuseColor = Color3.Yellow();
    //     pivotMarker.material = pivotMaterial;

    //     pivotMarker.parent = mesh;

    //     createLocalAxes(scene, pivotMarker);
    // };

    // const createLocalAxes = (scene, parent) => {
    //     const axisLength = 800;
    //     const axisThickness = 0.5;

    //     const xAxis = MeshBuilder.CreateLines("xAxis", {
    //         points: [Vector3.Zero(), new Vector3(axisLength, 0, 0)],
    //         updatable: false
    //     }, scene);
    //     xAxis.color = Color3.Red();
    //     xAxis.parent = parent;

    //     const yAxis = MeshBuilder.CreateLines("yAxis", {
    //         points: [Vector3.Zero(), new Vector3(0, axisLength, 0)],
    //         updatable: false
    //     }, scene);
    //     yAxis.color = Color3.Green();
    //     yAxis.parent = parent;

    //     const zAxis = MeshBuilder.CreateLines("zAxis", {
    //         points: [Vector3.Zero(), new Vector3(0, 0, axisLength)],
    //         updatable: false
    //     }, scene);
    //     zAxis.color = Color3.Blue();
    //     zAxis.parent = parent;
    // };

    return (
        <div style={{ width: '100%', height: '100vh', overflow: 'hidden', position: 'relative' }}>
            <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f1f1f1', display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: '20px' }}>
                    <label>Use Right-Handed System: </label>
                    <select
                        value={useRightHandedSystem}
                        onChange={(e) => setUseRightHandedSystem(e.target.value === 'true')}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                <div style={{ marginRight: '20px' }}>
                    <label>Do Not Alter File Coordinates: </label>
                    <select
                        value={doNotAlterFileCoordinates}
                        onChange={(e) => setDoNotAlterFileCoordinates(e.target.value === 'true')}
                    >
                        <option value="true">True</option>
                        <option value="false">False</option>
                    </select>
                </div>
                <input
                    type="file"
                    onChange={handleFileUpload}
                    accept=".gltf,.glb,.babylon,.obj,.stl,.fbx,.dae,.3ds,.blend,.ply,.3mf"
                    multiple
                    style={{ marginRight: '20px' }}
                />
                <div style={{ marginLeft: 'auto', padding: '5px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
                    Hovered Axis: {hoveredAxis}
                </div>
            </div>
            <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 50px)', display: 'block' }} />
            {showPopup && (
                <Popup
                    onClose={() => setShowPopup(false)}
                    onSubmit={handlePopupSubmit}
                    mesh={selectedMesh}
                />
            )}
        </div>
    );
};

export default BabylonScene;













// import React, { useEffect, useRef, useState } from 'react';
// import {
//     Engine,
//     Scene,
//     ArcRotateCamera,
//     Vector3,
//     HemisphericLight,
//     SceneLoader,
//     ActionManager,
//     ExecuteCodeAction,
//     MeshBuilder,
//     Color3,
//     StandardMaterial,
//     Axis,
//     Space

// } from '@babylonjs/core';
// import '@babylonjs/loaders'; // Import loaders for additional file formats
// import '@babylonjs/inspector'; // Import the inspector for debugging
// import { STLFileLoader } from '@babylonjs/loaders/STL'; // Import STL file loader specifically
// import Popup from './PopUp'; // Import the Popup component

// const BabylonScene = () => {
//     const canvasRef = useRef(null);
//     const [hoveredAxis, setHoveredAxis] = useState('?');
//     const [meshesToRender, setMeshesToRender] = useState([]);
//     const [currentMeshIndex, setCurrentMeshIndex] = useState(0);
//     const [showPopup, setShowPopup] = useState(false);
//     const [useRightHandedSystem, setUseRightHandedSystem] = useState(true);
//     const [doNotAlterFileCoordinates, setDoNotAlterFileCoordinates] = useState(true);











//     useEffect(() => {
//         const canvas = canvasRef.current;
//         const engine = new Engine(canvas, true);
//         const scene = new Scene(engine);
//         scene.useRightHandedSystem = useRightHandedSystem; // Set right-handed system based on dropdown

//         // Set the STL loader option based on dropdown
//         STLFileLoader.DO_NOT_ALTER_FILE_COORDINATES = doNotAlterFileCoordinates;

//         // Camera setup to match Creo's default isometric view
//         const camera = new ArcRotateCamera('camera1', -Math.PI / 4, Math.PI / 4, 20, new Vector3(0, 0, 0), scene);
//         camera.attachControl(canvas, true);

//         // Adjust camera settings for smooth zoom
//         camera.inertia = 0.9; // Makes the camera movement smoother
//         camera.wheelPrecision = 50; // Lower value for finer zoom control
//         camera.minZ = 0.1; // Prevents the camera from moving through the object
//         camera.lowerRadiusLimit = 0.5; // Set the closest zoom distance to prevent moving through objects
//         camera.upperRadiusLimit = 100; // Set a reasonable maximum zoom distance

//         // Light
//         new HemisphericLight('light1', new Vector3(0, 1, 0), scene);



//         const pilot = MeshBuilder.CreateCylinder("pilot", {height:0.75, diameterTop:0.2, diameterBottom:0.5, tessellation:6, subdivisions:1} , scene);

//         const arm = MeshBuilder.CreateBox("arm", {height:0.75, width:0.3, depth:0.1875 }, scene);
        
//         arm.position.x = 0.125;
//         arm.parent = pilot;


//         // const localOrigin = localAxes(2);
//         // const worldLocalOrigin = localAxes(2);	
//         pilot.position = new Vector3(0, 0, 0);




//         const deltaTheta = Math.PI/256;
        
//         scene.registerBeforeRender(function () {
//         pilot.rotation = new Vector3(0, 0, 90),Space.LOCAL;
//         //  pilot.rotate(Axis.X, deltaTheta, Space.LOCAL);	
//         //  pilot.rotate(Axis.Y, 0, Space.LOCAL);
//         //   pilot.rotate(Axis.Z, 0, Space.LOCAL);
//         });
       











//         // Create axis lines with appropriate lengths
//         createAxisLines(scene);

//         // Show the scene explorer and inspector
//         scene.debugLayer.show();

//         // Run the render loop
//         engine.runRenderLoop(() => scene.render());

//         // Handle window resize
//         window.addEventListener('resize', () => engine.resize());

//         return () => engine.dispose();
//     }, [useRightHandedSystem, doNotAlterFileCoordinates]); // Re-run effect when options change
























    

//     const createAxisLines = (scene) => {
//         const axisLength = 1000; // Length of the axis in both directions
//         const axisThickness = 20; // Thickness of the axis lines

//         createAxis(scene, new Vector3(1, 0, 0), Color3.Red(), axisLength, axisThickness, 'X+');
//         createAxis(scene, new Vector3(-1, 0, 0), Color3.Red(), axisLength, axisThickness, 'X-');
//         createAxis(scene, new Vector3(0, 1, 0), Color3.Green(), axisLength, axisThickness, 'Y+');
//         createAxis(scene, new Vector3(0, -1, 0), Color3.Green(), axisLength, axisThickness, 'Y-');
//         createAxis(scene, new Vector3(0, 0, 1), Color3.Blue(), axisLength, axisThickness, 'Z+');
//         createAxis(scene, new Vector3(0, 0, -1), Color3.Blue(), axisLength, axisThickness, 'Z-');
//     };

//     const createAxis = (scene, direction, color, length, thickness, axisName) => {
//         // Points for both positive and negative direction
//         const points = [Vector3.Zero(), direction.scale(length)];
//         const axis = MeshBuilder.CreateLines(`${axisName}Axis`, { points }, scene);

//         const axisMaterial = new StandardMaterial(`${axisName}Material`, scene);
//         axisMaterial.diffuseColor = color;
//         axis.material = axisMaterial;

//         axis.color = color; // Set the line color

//         axis.actionManager = new ActionManager(scene);
//         axis.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOverTrigger, () => setHoveredAxis(axisName)));
//         axis.actionManager.registerAction(new ExecuteCodeAction(ActionManager.OnPointerOutTrigger, () => setHoveredAxis('?')));
//     };

//     const handleFileUpload = async (event) => {
//         const files = event.target.files;
//         if (files.length > 0) {
//             const scene = canvasRef.current.__scene__; // Access the current scene
//             const loadedMeshes = [];

//             for (let file of files) {
//                 try {
//                     const result = await SceneLoader.ImportMeshAsync("", "", file, scene);
//                     result.meshes.forEach((mesh, index) => {
//                         if (file.name.endsWith('.stl')) {
//                             mesh.scaling = new Vector3(0.001, 0.001, 0.001);
//                         }
//                         // Set mesh name to file name (without extension)
//                         mesh.name = `${file.name.split('.')[0]}_mesh_${index}`;
//                         loadedMeshes.push(mesh);

//                         // Visualize the pivot point with a small sphere and axes
//                         createPivotPointMarker(mesh, scene);
//                     });
//                 } catch (error) {
//                     console.error(`Error loading model ${file.name}:`, error);
//                 }
//             }

//             setMeshesToRender(loadedMeshes);
//             if (loadedMeshes.length > 0) {
//                 setShowPopup(true); // Show the popup for the first mesh
//             }
//         }
//     };

//     const createPivotPointMarker = (mesh, scene) => {
//         // Create a much larger sphere to mark the pivot point
//         const pivotMarker = MeshBuilder.CreateSphere(`${mesh.name}_pivotMarker`, { diameter: 10 }, scene);
//         pivotMarker.position = mesh.getAbsolutePosition();
        
//         const pivotMaterial = new StandardMaterial(`${mesh.name}_pivotMaterial`, scene);
//         pivotMaterial.diffuseColor = Color3.Yellow();
//         pivotMarker.material = pivotMaterial;
        
//         // Attach the pivot marker to the mesh
//         pivotMarker.parent = mesh;
        
//         // Create and attach much larger local axes to the pivot point
//         createLocalAxes(scene, pivotMarker);
//     };
        
//     const createLocalAxes = (scene, parent) => {
//         const axisLength = 800; // Significantly increase the length of the small axes
//         const axisThickness = 0.5; // Increase the thickness of the small axes
        
//         // X axis (Red)
//         const xAxis = MeshBuilder.CreateLines("xAxis", {
//             points: [Vector3.Zero(), new Vector3(axisLength, 0, 0)],
//             updatable: false
//         }, scene);
//         xAxis.color = Color3.Red();
//         xAxis.parent = parent;
        
//         // Y axis (Green)
//         const yAxis = MeshBuilder.CreateLines("yAxis", {
//             points: [Vector3.Zero(), new Vector3(0, axisLength, 0)],
//             updatable: false
//         }, scene);
//         yAxis.color = Color3.Green();
//         yAxis.parent = parent;
        
//         // Z axis (Blue)
//         const zAxis = MeshBuilder.CreateLines("zAxis", {
//             points: [Vector3.Zero(), new Vector3(0, 0, axisLength)],
//             updatable: false
//         }, scene);
//         zAxis.color = Color3.Blue();
//         zAxis.parent = parent;
//     };

//     const handlePopupSubmit = (position, rotation) => {
//         const mesh = meshesToRender[currentMeshIndex];
//         mesh.position = new Vector3(position.x, position.y, position.z);
//         mesh.rotation = new Vector3(rotation.x, rotation.y, rotation.z);

//         // Proceed to the next mesh
//         const nextIndex = currentMeshIndex + 1;
//         if (nextIndex < meshesToRender.length) {
//             setCurrentMeshIndex(nextIndex);
//             setShowPopup(true); // Show the popup for the next mesh
//         } else {
//             setShowPopup(false); // Hide the popup when done
//         }
//     };

//     const handlePopupClose = () => {
//         setShowPopup(false);
//     };

//     return (
//         <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
//             <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f1f1f1', display: 'flex', alignItems: 'center' }}>
//                 <div style={{ marginRight: '20px' }}>
//                     <label>Use Right-Handed System: </label>
//                     <select
//                         value={useRightHandedSystem}
//                         onChange={(e) => setUseRightHandedSystem(e.target.value === 'true')}
//                     >
//                         <option value="true">True</option>
//                         <option value="false">False</option>
//                     </select>
//                 </div>
//                 <div style={{ marginRight: '20px' }}>
//                     <label>Do Not Alter File Coordinates: </label>
//                     <select
//                         value={doNotAlterFileCoordinates}
//                         onChange={(e) => setDoNotAlterFileCoordinates(e.target.value === 'true')}
//                     >
//                         <option value="true">True</option>
//                         <option value="false">False</option>
//                     </select>
//                 </div>
//                 <input
//                     type="file"
//                     onChange={handleFileUpload}
//                     accept=".gltf,.glb,.babylon,.obj,.stl,.fbx,.dae,.3ds,.blend,.ply,.3mf"
//                     multiple
//                     style={{ marginRight: '20px' }}
//                 />
//                 <div style={{ marginLeft: 'auto', padding: '5px', backgroundColor: '#fff', border: '1px solid #ccc' }}>
//                     Hovered Axis: {hoveredAxis}
//                 </div>
//             </div>
//             <canvas ref={canvasRef} style={{ width: '100%', height: 'calc(100% - 50px)', display: 'block' }} />
//             {showPopup && (
//                 <Popup
//                     onClose={handlePopupClose}
//                     onSubmit={handlePopupSubmit}
//                     mesh={meshesToRender[currentMeshIndex]}
//                 />
//             )}
//         </div>
//     );
// };

// export default BabylonScene;




















