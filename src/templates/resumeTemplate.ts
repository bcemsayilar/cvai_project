export const resumeTemplate = `<div style="width: 595px; height: 842px; position: relative; background: #0F172A; overflow: hidden">
    <!-- Header Section -->
    <div style="left: 180px; top: 40px; position: absolute; flex-direction: column; justify-content: flex-start; align-items: center; gap: 20px; display: inline-flex">
      <div style="flex-direction: column; justify-content: flex-start; align-items: center; gap: 4px; display: flex">
        <div style="justify-content: flex-start; align-items: flex-start; gap: 16px; display: inline-flex">
          <div style="color: #E2E8F0; font-size: 28px; font-family: Plus Jakarta Sans; font-weight: 800; word-wrap: break-word">{{name}}</div>
        </div>
        <div style="justify-content: flex-start; align-items: flex-start; gap: 16px; display: inline-flex">
          <div style="color: #CBD5E1; font-size: 10px; font-family: Plus Jakarta Sans; font-weight: 500; word-wrap: break-word">{{title}}</div>
        </div>
      </div>
      <div style="flex-direction: column; justify-content: flex-start; align-items: center; gap: 6px; display: flex">
        <div style="justify-content: flex-start; align-items: flex-start; gap: 8px; display: inline-flex">
          <div style="justify-content: flex-start; align-items: center; gap: 2px; display: flex">
            <div style="width: 5.76px; height: 7px; background: #E2E8F0"></div>
            <div style="height: 9px; justify-content: center; align-items: center; gap: 16px; display: flex">
              <div style="color: #E2E8F0; font-size: 7px; font-family: Plus Jakarta Sans; font-weight: 400; line-height: 11px; word-wrap: break-word">{{location}}</div>
            </div>
          </div>
          <div style="justify-content: flex-start; align-items: center; gap: 2px; display: flex">
            <!-- Contacts Placeholder -->
            <div>{{contacts}}</div>
          </div>
        </div>
      </div>
    </div>
    <!-- Education Section -->
    <div style="left: 64px; top: 192px; position: absolute; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 14px; display: inline-flex">
      <div style="justify-content: flex-start; align-items: flex-start; gap: 16px; display: inline-flex">
        <div style="color: #E2E8F0; font-size: 9px; font-family: Plus Jakarta Sans; font-weight: 700; word-wrap: break-word">Education</div>
      </div>
      <div style="width: 468px; height: 0px; outline: 0.50px #334155 solid; outline-offset: -0.25px"></div>
      <div>{{education}}</div>
    </div>
    <!-- Experience Section -->
    <div style="left: 64px; top: 350px; position: absolute; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 14px; display: inline-flex">
      <div style="justify-content: flex-start; align-items: flex-start; gap: 16px; display: inline-flex">
        <div style="color: #E2E8F0; font-size: 9px; font-family: Plus Jakarta Sans; font-weight: 700; word-wrap: break-word">Experience</div>
      </div>
      <div style="width: 468px; height: 0px; outline: 0.50px #334155 solid; outline-offset: -0.25px"></div>
      <div>{{experience}}</div>
    </div>
    <!-- Skills Section -->
    <div style="left: 64px; top: 600px; position: absolute; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 14px; display: inline-flex">
      <div style="color: #E2E8F0; font-size: 9px; font-family: Plus Jakarta Sans; font-weight: 700; word-wrap: break-word">Skills & Tools</div>
      <div style="width: 468px; height: 0px; outline: 0.50px #334155 solid; outline-offset: -0.25px"></div>
      <div>{{skills}}</div>
    </div>
    <!-- Add more sections as needed with placeholders -->
</div>
`;