import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Vector3, Axis, Space } from '@babylonjs/core'; // Import necessary Babylon.js classes

const Popup = ({ onClose, onSubmit, mesh }) => {
    const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });
    const [rotationSpace, setRotationSpace] = useState(Space.LOCAL); // Default to local rotation

    useEffect(() => {
        if (mesh) {
            // Initialize with the mesh's current position and rotation
            setPosition({ x: mesh.position.x, y: mesh.position.y, z: mesh.position.z });
            setRotation({ x: 0, y: 0, z: 0 }); // Start rotation as zero since we'll use `rotate`
        }
    }, [mesh]);

    const handlePositionChange = (axis, value) => {
        const newPos = { ...position, [axis]: parseFloat(value) };
        setPosition(newPos);
        mesh.position = new Vector3(newPos.x, newPos.y, newPos.z); // Update the mesh position
    };

    const handleRotationChange = (axis, value) => {
        const newRot = { ...rotation, [axis]: parseFloat(value) };
        const delta = newRot[axis] - rotation[axis]; // Calculate the delta
        setRotation(newRot);
        applyRotation(axis, delta);
    };

    const applyRotation = (axis, delta) => {
        const space = rotationSpace; // Use the selected rotation space (local or global)
        switch (axis) {
            case 'x':
                mesh.rotate(Axis.X, delta, space);
                break;
            case 'y':
                mesh.rotate(Axis.Y, delta, space);
                break;
            case 'z':
                mesh.rotate(Axis.Z, delta, space);
                break;
            default:
                break;
        }
    };

    const handleRotationSpaceChange = (e) => {
        setRotationSpace(e.target.value === 'local' ? Space.LOCAL : Space.WORLD);
    };

    const handleSubmit = () => {
        onSubmit(position, rotation);
        onClose();
    };

    return ReactDOM.createPortal(
        <div style={{ position: 'absolute', top: '20%', left: '20%', padding: '20px', background: '#fff', border: '1px solid #ccc', zIndex: 1000 }}>
            <h3>Set Position and Rotation for {mesh.name}</h3>
            <div>
                <label>Position:</label>
                {['x', 'y', 'z'].map(axis => (
                    <div key={axis}>
                        <label>{axis.toUpperCase()}: </label>
                        <input
                            type="number"
                            step="0.001"
                            value={position[axis]}
                            onChange={e => handlePositionChange(axis, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div>
                <label>Rotation (radians):</label>
                {['x', 'y', 'z'].map(axis => (
                    <div key={axis}>
                        <label>{axis.toUpperCase()}: </label>
                        <input
                            type="number"
                            step="0.001"
                            value={rotation[axis]}
                            onChange={e => handleRotationChange(axis, e.target.value)}
                        />
                        <input
                            type="range"
                            min="-3.14"
                            max="3.14"
                            step="0.01"
                            value={rotation[axis]}
                            onChange={e => handleRotationChange(axis, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div>
                <label>Rotation Space:</label>
                <select value={rotationSpace === Space.LOCAL ? 'local' : 'global'} onChange={handleRotationSpaceChange}>
                    <option value="local">Local</option>
                    <option value="global">Global</option>
                </select>
            </div>
            {/* <button onClick={handleSubmit}>Apply</button> */}
            <button onClick={onClose}>Close</button>
        </div>,
        document.body // Use a portal to render the Popup at the top level of the DOM
    );
};

export default Popup;

















// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';

// const Popup = ({ onClose, onSubmit, mesh }) => {
//     const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
//     const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

//     const handlePositionChange = (axis, value) => {
//         setPosition({ ...position, [axis]: parseFloat(value) });
//     };

//     const handleRotationChange = (axis, value) => {
//         setRotation({ ...rotation, [axis]: parseFloat(value) });
//     };

//     const normalizeRadians = (value) => {
//         while (value < 0) value += 2 * Math.PI;
//         return value % (2 * Math.PI);
//     };
    

//     const handleSubmit = () => {
//         const convertedPosition = {
//             x: position.x,
//             y: position.y,
//             z: position.z
//         };

//         const convertedRotation = {
//             x: normalizeRadians(rotation.x),
//             y: normalizeRadians(rotation.y),
//             z: normalizeRadians(rotation.z)
//         };

//         onSubmit(convertedPosition, convertedRotation);
//         onClose();
//     };

//     return ReactDOM.createPortal(
//         <div style={{ position: 'absolute', top: '20%', left: '20%', padding: '20px', background: '#fff', border: '1px solid #ccc', zIndex: 1000 }}>
//             <h3>Set Position and Rotation for {mesh.name}</h3>
//             <div>
//                 <label>Position:</label>
//                 {['x', 'y', 'z'].map(axis => (
//                     <div key={axis}>
//                         <label>{axis.toUpperCase()}: </label>
//                         <input
//                             type="number"
//                             step="0.001"
//                             value={position[axis]}
//                             onChange={e => handlePositionChange(axis, e.target.value)}
//                         />
//                     </div>
//                 ))}
//             </div>
//             <div>
//                 <label>Rotation (radians):</label>
//                 {['x', 'y', 'z'].map(axis => (
//                     <div key={axis}>
//                         <label>{axis.toUpperCase()}: </label>
//                         <input
//                             type="number"
//                             step="0.001"
//                             value={rotation[axis]}
//                             onChange={e => handleRotationChange(axis, e.target.value)}
//                         />
//                     </div>
//                 ))}
//             </div>
//             <button onClick={handleSubmit}>Apply</button>
//             <button onClick={onClose}>Close</button>
//         </div>,
//         document.body // Use a portal to render the Popup at the top level of the DOM
//     );
// };

// export default Popup;


















// import React, { useState } from 'react';
// import ReactDOM from 'react-dom';

// const Popup = ({ onClose, onSubmit, mesh }) => {
//     const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
//     const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

//     const handlePositionChange = (axis, value) => {
//         setPosition({ ...position, [axis]: parseFloat(value) });
//     };

//     const handleRotationChange = (axis, value) => {
//         setRotation({ ...rotation, [axis]: parseFloat(value) });
//     };

//     const handleSubmit = () => {
        
//         const convertedRotation = {
//             x: rotation.x * (Math.PI / 180),
//             y: rotation.y * (Math.PI / 180),
//             z: rotation.z * (Math.PI / 180)
//         };

//         onSubmit(position, convertedRotation);
//         onClose();
//     };

//     return ReactDOM.createPortal(
//         <div style={{ position: 'absolute', top: '20%', left: '20%', padding: '20px', background: '#fff', border: '1px solid #ccc', zIndex: 1000 }}>
//             <h3>Set Position and Rotation for {mesh.name}</h3>
//             <div>
//                 <label>Position (in meters):</label>
//                 {['x', 'y', 'z'].map(axis => (
//                     <div key={axis}>
//                         <label>{axis.toUpperCase()}: </label>
//                         <input
//                             type="number"
//                             value={position[axis]}
//                             onChange={e => handlePositionChange(axis, e.target.value)}
//                         />
//                     </div>
//                 ))}
//             </div>
//             <div>
//                 <label>Rotation (in degrees):</label>
//                 {['x', 'y', 'z'].map(axis => (
//                     <div key={axis}>
//                         <label>{axis.toUpperCase()}: </label>
//                         <input
//                             type="number"
//                             value={rotation[axis]}
//                             onChange={e => handleRotationChange(axis, e.target.value)}
//                         />
//                     </div>
//                 ))}
//             </div>
//             <button onClick={handleSubmit}>Apply</button>
//             <button onClick={onClose}>Close</button>
//         </div>,
//         document.body // Use a portal to render the Popup at the top level of the DOM
//     );
// };

// export default Popup;
