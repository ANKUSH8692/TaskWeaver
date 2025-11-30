$file = "d:\Project\TaskWeaver\taskweaver-frontend\src\pages\TaskDetailsPage.js"
$content = Get-Content $file -Raw

# Add loading state after line 25
$content = $content -replace '(const \[rating, setRating\] = useState\(\{ score: 5, comments: '''' \}\);)', '$1  const [loading, setLoading] = useState(false);'

# Add handleSubmitTask function after handleAddRating
$submitTaskFunction = @"

  const handleSubmitTask = async () => {
    if (!window.confirm('Are you sure you want to submit this task? This will mark it as completed.')) {
      return;
    }

    try {
      await taskService.updateStatus(id, 'completed');
      fetchTask();
      alert('Task submitted successfully!');
    } catch (error) {
      console.error('Failed to submit task:', error);
      alert('Failed to submit task. Please try again.');
    }
  };
"@

$content = $content -replace '(const handleAddRating[^}]+}\s+};)', "`$1$submitTaskFunction"

# Add loading state management to fetchTask
$content = $content -replace '(const fetchTask = async \(\) => \{)', '$1    setLoading(true);'
$content = $content -replace '(dispatch\(getTaskSuccess\(response\.data\)\);)', '$1    } finally {      setLoading(false);'

# Add loading check before return
$content = $content -replace '(const isAdmin = employee\?\.role === ''admin'';)', '$1  if (loading) {    return <div className="loading">Loading task details...</div>;  }'

# Fix employee ID comparison
$content = $content -replace 'currentTask\?\.assignedTo\?\.\_id === employee\.\_id', 'currentTask?.assignedTo?._id === employee.employeeId'

# Add Submit Task button after form
$submitButton = @"

        {!isNew && employee?.role === 'employee' && currentTask?.assignedTo?._id === employee.employeeId && currentTask?.status !== 'completed' && (
          <div className="form-actions" style={{ marginTop: '1rem' }}>
            <button type="button" onClick={handleSubmitTask} className="btn-primary">
              Submit Task
            </button>
          </div>
        )}
"@

$content = $content -replace '(\s+</form>)', "$submitButton`$1"

Set-Content $file $content
Write-Host "TaskDetailsPage.js updated successfully!"
